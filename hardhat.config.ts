import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/kh-6deUFzrJDEr-iY7R7MKt8BTjgMZpC",
        blockNumber: 18088112
      }
    }
  }
};

export default config;
