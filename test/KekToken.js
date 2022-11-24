const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const LIQUIDITY_SUPPLY = ethers.utils.parseEther("10");
const EXCHANGED = ethers.utils.parseEther("1");

const MainNetAaveToken = "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9";
const MainNetAaveGiant = "0x3744DA57184575064838BBc87A0FC791F5E39eA2";
const MainNetUniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

describe("KekToken/Aave pair", function () {
  async function deployTokenFixture() {
    const [owner, gasProvider, liquidityProvider] = await ethers.getSigners();

    // Deploy our own token
    const KekToken = await ethers.getContractFactory("KekToken");
    const token = await KekToken.deploy();

    // Get Aave token
    const aaveTokenAbi =
      require("@aave/aave-token/artifacts/contracts/token/AaveToken.sol/AaveToken.json").abi;
    const aave = await ethers.getContractAt(aaveTokenAbi, MainNetAaveToken);
    const aaveGiant = await ethers.getImpersonatedSigner(MainNetAaveGiant);

    // Issue liquidity supply
    await token
      .connect(owner)
      .transfer(liquidityProvider.address, LIQUIDITY_SUPPLY);

    await gasProvider.sendTransaction({
      to: aaveGiant.address,
      value: ethers.utils.parseEther("1"),
      gasLimit: 2100000,
    });

    await aave
      .connect(aaveGiant)
      .transfer(liquidityProvider.address, LIQUIDITY_SUPPLY);

    // Get Uniswap components
    const uniswapRouterAbi =
      require("@uniswap/v2-periphery/build/UniswapV2Router02.json").abi;
    const uniswapRouter = await ethers.getContractAt(
      uniswapRouterAbi,
      MainNetUniswapRouter
    );

    const uniswapFactoryAbi =
      require("@uniswap/v2-core/build/UniswapV2Factory.json").abi;
    const uniswapFactory = await ethers.getContractAt(
      uniswapFactoryAbi,
      await uniswapRouter.factory()
    );

    // Allow the router to coordinate token transfers
    await token
      .connect(liquidityProvider)
      .approve(uniswapRouter.address, LIQUIDITY_SUPPLY);
    await aave
      .connect(liquidityProvider)
      .approve(uniswapRouter.address, LIQUIDITY_SUPPLY);

    // Create Uniswap pair
    await uniswapFactory.createPair(token.address, aave.address);

    await uniswapRouter
      .connect(liquidityProvider)
      .addLiquidity(
        token.address,
        aave.address,
        LIQUIDITY_SUPPLY,
        LIQUIDITY_SUPPLY,
        0,
        0,
        liquidityProvider.address,
        (await time.latest()) + 60
      );

    const uniswapPairAbi =
      require("@uniswap/v2-core/build/UniswapV2Pair.json").abi;
    const pair = await ethers.getContractAt(
      uniswapPairAbi,
      await uniswapFactory.getPair(token.address, aave.address)
    );

    return {
      token,
      aave,
      owner,
      router: uniswapRouter,
      factory: uniswapFactory,
      pair: pair,
    };
  }

  describe("KekToken", function () {
    it("Should mint initial supply to owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(
        BigInt(ownerBalance) + BigInt(LIQUIDITY_SUPPLY)
      );
    });

    it("Should move liquidity supply to pair", async function () {
      const { pair } = await loadFixture(deployTokenFixture);

      const { _reserve0, _reserve1 } = await pair.getReserves();
      expect(_reserve0).to.equal(LIQUIDITY_SUPPLY);
      expect(_reserve1).to.equal(LIQUIDITY_SUPPLY);
    });
  });

  describe("Aave", function () {
    it("Owner of KekToken shouldn't have Aave prior to swap", async function () {
      const { aave, owner } = await loadFixture(deployTokenFixture);

      const ownerBalance = await aave.balanceOf(owner.address);
      expect(ownerBalance).to.equal(0);
    });
  });

  describe("Swap", function () {
    it("Swaps KekToken for Aave", async function () {
      const { token, aave, owner, pair, router } = await loadFixture(
        deployTokenFixture
      );

      const originalKekBalance = await token.balanceOf(owner.address);
      const originalAaveBalance = await aave.balanceOf(owner.address);

      await token.connect(owner).approve(router.address, EXCHANGED);
      await router.swapExactTokensForTokens(
        EXCHANGED,
        EXCHANGED.toBigInt() / BigInt(2),
        [token.address, aave.address],
        owner.address,
        (await time.latest()) + 60
      );

      const kekBalance = await token.balanceOf(owner.address);
      const aaveBalance = await aave.balanceOf(owner.address);

      expect(BigInt(originalKekBalance) - BigInt(kekBalance)).to.eq(EXCHANGED);
      expect(BigInt(aaveBalance) - BigInt(originalAaveBalance)).to.gt(0);
    });
  });
});
