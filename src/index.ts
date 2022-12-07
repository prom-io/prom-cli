import {
  approveCollection,
  getUserInput,
  listNFTs,
  listQuestions,
  reindexNFTs,
  waitUnconfirmedTxns,
} from "@/cli";
import { ChainId, marketplaces, providers, signaleLogger } from "@/config";
import { AppDataSource, dbPath } from "@/db";
import { Marketplace } from "@/marketplace";
import { Command } from "commander";
import { ethers } from "ethers";
import ora from "ora";
import "reflect-metadata";
import fs from "fs";
import { delistNFTs } from "@/cli/delistNFTs";

const app = new Command();

app.name("prom-cli");
app.description("Prom CLI allows to list multiple NFTs blazing fast");
app.version("1.0.0");

app.option("-m --marketplace <address>", "custom marketplace address");
app.option("-r --rpc <url>", "custom rpc");

const logger = signaleLogger.scope("main");

(async () => {
  await AppDataSource.initialize();

  app.action(async () => {
    const { marketplace: customMarketplace } = app.opts();

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
    const marketplace = new Marketplace(marketplaceAddress, wallet);

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
