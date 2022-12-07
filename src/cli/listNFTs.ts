import { ChainId, signaleLogger } from "@/config";
import { AppDataSource } from "@/db";
import { NFT, Transaction } from "@/db/entities";
import { Marketplace } from "@/marketplace";
import dayjs from "dayjs";
import chunk from "lodash.chunk";
import ora from "ora";
import signale from "signale";

export type ListNFTsOptions = {
  chainId: ChainId;
  paymentTokenAddress: string;
  price: string;
};

const logger = signaleLogger.scope("listNFTs");

export const listNFTs = async (
  marketplace: Marketplace,
  { paymentTokenAddress, chainId, price }: ListNFTsOptions
) => {
  const nfts = await AppDataSource.manager.find(NFT, {
    where: { listed: false },
  });

  logger.debug("nfts", nfts);

  const nftsToList: typeof nfts = [];

  for (const nft of nfts) {
    const isListed = await marketplace.isListed({
      nftAddress: nft.address,
      tokenId: nft.tokenId,
    });

    logger.debug(
      "NFT",
      nft.address,
      nft.tokenId,
      "is",
      isListed ? "listed" : "not listed"
    );

    if (isListed) {
      nft.listed = true;
      await AppDataSource.manager.save(nft);
    } else {
      nftsToList.push(nft);
    }
  }

  signale.info(`Total NFTs to list: ${nftsToList.length}`);

  let chunkIndex = 0;

  for (const nftsChunk of chunk(nftsToList, 25)) {
    chunkIndex++;
    logger.info(`Listing nfts chunks #${chunkIndex}`);

    const tx = await marketplace.multicallList(
      nftsChunk.map(it => ({
        nftAddress: it.address,
        tokenId: it.tokenId,
      })),
      {
        paymentTokenAddress,
        price,
        startDate: dayjs(),
        endDate: dayjs().add(1, "year"),
      }
    );

    const transaction = AppDataSource.manager.create(Transaction, {
      id: tx.hash,
      hash: tx.hash,
      chainId: chainId,
      nfts: nftsChunk.map(it => {
        const nft = new NFT();
        nft.id = it.id;
        return nft;
      }),
    });

    await AppDataSource.manager.save(transaction);

    const txSpinner = ora(`Waiting for tx to be confirmed ${tx.hash}`).start();

    await tx.wait();

    txSpinner.succeed(`Confirmed ${tx.hash}`);

    await AppDataSource.createQueryBuilder()
      .update(NFT)
      .set({ listed: true })
      .where({ tx: transaction.id })
      .execute();
  }
};
