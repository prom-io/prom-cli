import { ChainId } from "@/config/ChainId";
import { ethers } from "ethers";

type ERC20Token = {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
};

export const paymentTokens: Partial<Record<ChainId, ERC20Token[]>> = {
  [ChainId.Polygon]: [
    {
      name: "Matic",
      address: ethers.constants.AddressZero,
      symbol: "MATIC",
      decimals: 18,
    },
    {
      name: "USD Tether",
      symbol: "USDT",
      decimals: 6,
      address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      decimals: 6,
    },
  ],
};
