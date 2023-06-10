import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-etherscan";
import "dotenv/config";
import { envEtherscanApiKey, envMnemonic, envRpc } from "./utils/env";
import { HardhatUserConfig } from "hardhat/config";

export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 20000,
      },
    },
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    goerli: {
      url: envRpc("goerli"),
      accounts: { mnemonic: envMnemonic("goerli") },
    },
    mainnet: {
      url: envRpc("mainnet"),
      accounts: { mnemonic: envMnemonic("mainnet") },
    },
  },
  etherscan: {
    apiKey: {
      mainnet: envEtherscanApiKey("mainnet"),
      goerli: envEtherscanApiKey("goerli"),
    },
  },
  paths: {
    tests: "./test",
    sources: "./src",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
} as HardhatUserConfig;
