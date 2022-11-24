require("@nomicfoundation/hardhat-toolbox");

const alchemyApiKey = process.env["ALCHEMY_API_KEY"] || "demo";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyApiKey}`,
      },
    },
  },
};
