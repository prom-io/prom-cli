import { AppDataSource } from "@/db";
import { NFT } from "@/db/entities/NFT";
import { fetchNFTs } from "@/api/fetchNFTs";
import { Wallet } from "ethers";
import ora from "ora";
import { signaleLogger } from "@/config";

const logger = signaleLogger.scope("reindex NFTs");

export const reindexNFTs = async (collection: string, wallet: Wallet) => {
  const spinner = ora("Loading NFTs");

  let shouldFetch = true;
  let skip = 0;

  const first = 1000;

  while (shouldFetch) {
    const data = await fetchNFTs(
      collection,
      wallet.address,
      (
        await wallet.provider.getNetwork()
      ).chainId,
      first,
      skip
    );

    skip += first;
    shouldFetch = data.length !== 0;

    logger.debug("fetched nfts", data);

    for (const token of data) {
      const nft = AppDataSource.manager.create(NFT, {
        address: collection,
        tokenId: token.identifier,
        listed: false,
        id: token.id,
      });

      try {
        await AppDataSource.manager.insert(NFT, nft);
      } catch (e: any) {
        if (e?.code !== "SQLITE_CONSTRAINT") {
          throw e;
        }
      }
    }
  }

  spinner.succeed();
};
