# MainNet fork with custom token Uniswap Pair
Simple test which creates a mainnet fork based on [Alchemy](https://alchemy.com)'s node, deploys a new token on the fork, and creates a Uniswap pair with Aave.

## Usage
1. Setup dependencies
   ```bash
   npm ci
   ```
2. Specify your Alchemy API key
   ```bash
   export ALCHEMY_API_KEY=...
   ```
3. Run the tests
   ```bash
   npx hardhat test
   ```

## Example
```
❯ npx hardhat test


  KekToken/Aave pair
    KekToken
      ✔ Should mint initial supply to owner (10717ms)
      ✔ Should move liquidity supply to pair
    Aave
      ✔ Owner of KekToken shouldn't have Aave prior to swap (296ms)
    Swap
      ✔ Swaps KekToken for Aave (1513ms)


  4 passing (13s)
```