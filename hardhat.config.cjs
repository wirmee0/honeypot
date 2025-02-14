require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    },
  },
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 137,
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 42161,
    },
    unichain: {
      url: process.env.UNICHAIN_MAINNET_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 130,
    },
    unichainSepolia: {
      url: process.env.UNICHAIN_SEPOLIA_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1301,
    }
  },
  etherscan: {
    apiKey: {
      polygon: process.env.VITE_POLYGONSCAN_API_KEY,
      arbitrum: process.env.VITE_ETHERSCAN_API_KEY,
      unichain: process.env.VITE_UNICHAIN_EXPLORER_API_KEY,
      unichainSepolia: process.env.VITE_UNICHAIN_EXPLORER_API_KEY,
    },
    customChains: [
      {
        network: "unichain",
        chainId: 130,
        urls: {
          apiURL: `${process.env.VITE_UNICHAIN_EXPLORER_URL}/api`,
          browserURL: process.env.VITE_UNICHAIN_EXPLORER_URL
        }
      },
      {
        network: "unichainSepolia",
        chainId: 1301,
        urls: {
          apiURL: "https://unichain-sepolia.blockscout.com/api",
          browserURL: "https://unichain-sepolia.blockscout.com"
        }
      }
    ]
  },
}; 