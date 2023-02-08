import {
  approveCollection,
  chainIdQuestion,
  getUserInput,
  listNFTs,
  listQuestions,
  privateKeyQuestion,
  reindexNFTs,
  waitUnconfirmedTxns,
} from "@/cli";
import { cancelPendingTxns } from "@/cli/cancelPendingTxns";
import { delistNFTs } from "@/cli/delistNFTs";
import { ChainId, marketplaces, providers, signaleLogger } from "@/config";
import { AppDataSource, dbPath } from "@/db";
import { Marketplace } from "@/marketplace";
import { Command } from "commander";
import { ethers } from "ethers";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import "reflect-metadata";

const app = new Command();

app.name("prom-cli");
app.description("Prom CLI allows to list multiple NFTs blazing fast");
app.version("1.0.6");

app.option("-m --marketplace <address>", "custom marketplace address");
app.option(
  "--max-fee <price>",
  "max fee per gas (max gas price non EIP-1559 compatible chains) in GWEI "
);
app.option("--max-priority-fee <price>", "max priority fee per gas in GWEI");
app.option(
  "--speed <speed>",
  "tx speed (fastest, fast, medium, slow)",
  "medium"
);
app.option("-r --rpc <url>", "custom rpc");

const logger = signaleLogger.scope("main");

(async () => {
  await AppDataSource.initialize();

  app.action(async () => {
    const {
      marketplace: customMarketplace,
      maxFee,
      maxPriorityFee,
      speed,
    } = app.opts();
    const userInput = await getUserInput(listQuestions);

    const {
      chainId: chainIdChoice,
      collection,
      privateKey,
      customChainId,
      paymentToken,
      customPaymentToken,
      price,
    } = userInput;

    const chainId = (customChainId || chainIdChoice) as unknown as ChainId;
    const paymentTokenAddress = customPaymentToken || paymentToken;

    const wallet = new ethers.Wallet(privateKey, providers[chainId]);

    logger.info("Using wallet", wallet.address);

    const marketplaceAddress = customMarketplace || marketplaces[chainId];
    const marketplace = new Marketplace(marketplaceAddress, wallet, {
      maxFee: parseFloat(maxFee),
      maxPriorityFee: parseFloat(maxPriorityFee),
      speed,
    });

    await reindexNFTs(marketplace, collection, wallet);
    await waitUnconfirmedTxns();
    await approveCollection(collection, marketplace, wallet);

    await listNFTs(marketplace, {
      paymentTokenAddress,
      chainId,
      price,
    });
  });

  app.command("delist").action(async () => {
    const { marketplace: customMarketplace } = app.opts();

    const userInput = await getUserInput();

    const {
      chainId: chainIdChoice,
      collection,
      privateKey,
      customChainId,
    } = userInput;

    const chainId = (customChainId || chainIdChoice) as unknown as ChainId;

    const wallet = new ethers.Wallet(privateKey, providers[chainId]);

    logger.info("Using wallet", wallet.address);

    const marketplaceAddress = customMarketplace || marketplaces[chainId];
    const marketplace = new Marketplace(marketplaceAddress, wallet);

    await reindexNFTs(marketplace, collection, wallet);
    await waitUnconfirmedTxns(false);
    await approveCollection(collection, marketplace, wallet);

    await delistNFTs(marketplace, chainId);
  });

  app
    .command("cancel-txns")
    .description("cancel pending transactions up to nonce")
    .action(async () => {
      const { privateKey, chainId } = await inquirer.prompt<{
        privateKey: string;
        chainId: ChainId;
      }>([privateKeyQuestion, chainIdQuestion]);

      const wallet = new ethers.Wallet(privateKey, providers[chainId]);

      await cancelPendingTxns(wallet);
    });

  app.command("clear-cache").action(async () => {
    const spinner = ora("Clearing cache").start();

    fs.rm(dbPath, err => {
      if (err) {
        spinner.fail(err.message);
        return;
      }

      spinner.succeed();
    });
  });

  app.parse();
})();
