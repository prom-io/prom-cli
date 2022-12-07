import { AppDataSource } from "@/db";
import { NFT } from "@/db/entities/NFT";
import { fetchNFTs } from "@/api/fetchNFTs";
import { Wallet } from "ethers";
import ora from "ora";
import { signaleLogger } from "@/config";
import { Marketplace } from "@/marketplace";

const logger = signaleLogger.scope("reindex NFTs");

export const reindexNFTs = async (
  marketplace: Marketplace,
  collection: string,
  wallet: Wallet
) => {
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

    logger.debug("fetched nfts", JSON.stringify(data));

    for (const token of data) {
      const isPublished =
        token.nftById.tradeListing?.find(
          it =>
            it.contract.toLocaleLowerCase() ===
            marketplace.address.toLocaleLowerCase()
        )?.published ?? false;

      logger.debug(`${token.id} isPublished`, isPublished);

      const nft = AppDataSource.manager.create(NFT, {
        address: collection,
        tokenId: token.identifier,
        listed: isPublished,
        id: token.id,
      });

      try {
        await AppDataSource.manager.insert(NFT, nft);
      } catch (e: any) {
        if (e?.code !== "SQLITE_CONSTRAINT") {
          throw e;
        } else {
          const nft = await AppDataSource.manager.findOneBy(NFT, {
            id: token.id,
          });

          if (nft) {
            logger.debug("Updating NFTs");

            nft.listed = isPublished;

            await AppDataSource.manager.save(nft);
          }
        }
      }
    }
  }

  spinner.succeed();
};
