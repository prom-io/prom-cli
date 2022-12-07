import { ChainId } from "@/config/ChainId";

export const marketplaces: Partial<Record<ChainId, string>> = {
  [ChainId.Ethereum]: "0xaa3734c3ad2721bb54e404e454c1f8d4259ce239",
  [ChainId.BSC]: "0x6Ed3580Fe5cD165F1D4694e3125e0cD7f084CA2B",
  [ChainId.Polygon]: "0x1ddFdcd35533dC639bA3387CddbB0Bc80738ffd2",
};
