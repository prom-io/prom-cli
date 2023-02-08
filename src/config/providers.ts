import { ChainId } from "@/config/ChainId";
import { ethers } from "ethers";

export const polygonProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/polygon",
  ChainId.Polygon
);

export const avaxProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/avalanche-c",
  ChainId.AvalancheC
);

export const bscProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/bsc",
  ChainId.BSC
);

export const fantomProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/fantom",
  ChainId.Fantom
);

export const arbitrumProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/arbitrum",
  ChainId.Arbitrum
);

export const optimismProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/optimism",
  ChainId.Optimism
);

export const mainnetProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth",
  ChainId.Ethereum
);

export const providers = {
  [ChainId.Polygon]: polygonProvider,
  [ChainId.AvalancheC]: avaxProvider,
  [ChainId.BSC]: bscProvider,
  [ChainId.Fantom]: fantomProvider,
  [ChainId.Arbitrum]: arbitrumProvider,
  [ChainId.Optimism]: optimismProvider,
  [ChainId.Ethereum]: mainnetProvider,
} as const;
