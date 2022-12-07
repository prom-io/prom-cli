import { ChainId, signaleLogger } from "@/config";
import { AppDataSource } from "@/db";
import { NFT, Transaction } from "@/db/entities";
import { Marketplace } from "@/marketplace";
import chunk from "lodash.chunk";
import ora from "ora";

const logger = signaleLogger.scope("delistNFTs");

export const delistNFTs = async (
  marketplace: Marketplace,
  chainId: ChainId
) => {
  const nfts = await AppDataSource.manager.find(NFT, {
    where: { listed: true },
  });

  const nftsToDelist: typeof nfts = [];

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

    if (!isListed) {
      nft.listed = false;
      await AppDataSource.manager.save(nft);
    } else {
      nftsToDelist.push(nft);
    }
  }

  logger.info(`Total NFTs to delist: ${nftsToDelist.length}`);

  let chunkIndex = 0;

  for (const nftsChunk of chunk(nftsToDelist, 25)) {
    chunkIndex++;
    logger.info(`Delist nfts chunks #${chunkIndex}`);

    const tx = await marketplace.multicallCancel(
      nftsChunk.map(it => ({
        nftAddress: it.address,
        tokenId: it.tokenId,
      }))
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
      .set({ listed: false, tx: null })
      .where({ tx: transaction.id })
      .execute();
  }
};
