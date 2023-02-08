import { ChainId, paymentTokens } from "@/config";
import { ethers } from "ethers";
import inquirer, { DistinctQuestion, QuestionCollection } from "inquirer";

export type UserInput = {
  privateKey: string;
  collection: string;
  chainId: string;
  customChainId: string;
  customPaymentToken: string;
  paymentToken: string;
  price: string;
};

export const privateKeyQuestion: DistinctQuestion = {
  type: "password",
  name: "privateKey",
  message: "Please provide your wallet private key",
  validate: input => {
    try {
      new ethers.Wallet(input);

      return true;
    } catch {
      return false;
    }
  },
};

export const chainIdQuestion: DistinctQuestion = {
  name: "chainId",
  message: "Choose Network",
  type: "list",
  choices: [
    {
      name: "Ethereum (1)",
      value: ChainId.Ethereum,
    },
    {
      name: "Polygon (137)",
      value: ChainId.Polygon,
    },
    {
      name: "BSC (56)",
      value: ChainId.BSC,
    },
    {
      name: "BSC Testnet",
      value: 97,
    },
    { name: "Other", value: "other" },
  ],
};

const commonQuestions: DistinctQuestion[] = [
  privateKeyQuestion,
  {
    name: "collection",
    message: "NFT Collection address",
    type: "input",
  },
  chainIdQuestion,
  {
    name: "customChainId",
    message: "Please enter chain id",
    type: "input",
    when: ({ chainId }) => {
      return chainId === "other";
    },
  },
];

export const listQuestions: DistinctQuestion[] = [
  {
    name: "paymentToken",
    message: "Please choose payment token",
    type: "list",
    choices: ({ chainId, customChainId }) => {
      const network = (customChainId || chainId) as unknown as ChainId;

      return [
        ...(paymentTokens[network]?.map(it => ({
          name: it.symbol,
          value: it.address,
        })) || []),
        { name: "Other (should be approved by Prom)", value: "other" },
      ];
    },
  },
  {
    name: "customPaymentToken",
    message: "Please enter payment token address",
    type: "input",
    when: ({ paymentToken }) => {
      return paymentToken === "other";
    },
  },
  {
    name: "price",
    message: "Price per item",
    type: "input",
  },
];

export const getUserInput = (additionalQuestions: DistinctQuestion[] = []) => {
  return inquirer.prompt<UserInput>([
    ...commonQuestions,
    ...additionalQuestions,
  ]);
};
