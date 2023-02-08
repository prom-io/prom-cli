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
  [ChainId.BSC]: [
    {
      name: "Binance",
      address: ethers.constants.AddressZero,
      symbol: "BNB",
      decimals: 18,
    },
    {
      name: "USD Tether",
      symbol: "USDT",
      decimals: 6,
      address: "0x55d398326f99059ff775485246999027b3197955",
    },
    {
      name: "Binance Pegged USD",
      symbol: "BUSD",
      decimals: 18,
      address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    },
  ],
  [ChainId.Ethereum]: [
    {
      name: "Ether",
      address: ethers.constants.AddressZero,
      symbol: "ETH",
      decimals: 18,
    },
    {
      name: "USD Tether",
      symbol: "USDT",
      decimals: 6,
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 18,
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    },
  ],
  [ChainId.Fantom]: [
    {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    },
    {
      name: "Fantom",
      symbol: "FTM",
      decimals: 18,
      address: "ethers.constants.AddressZero",
    },
  ],
};
