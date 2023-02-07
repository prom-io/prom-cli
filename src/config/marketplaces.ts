import { ChainId } from "@/config/ChainId";

export const marketplaces: Partial<Record<ChainId, string>> = {
  [ChainId.Ethereum]: "0x9bF0A8b1DB303c6A5333CFE07bDf58E4b9A8584a",
  [ChainId.BSC]: "0xC1b3EdE61f1EAf379c315D72C8E94ef6c3b52981",
  [ChainId.Polygon]: "0x1ddFdcd35533dC639bA3387CddbB0Bc80738ffd2",
  [ChainId.Fantom]: "0x1ddFdcd35533dC639bA3387CddbB0Bc80738ffd2",
};
