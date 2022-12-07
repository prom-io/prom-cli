import { ChainId, providers } from "@/config";
import { AppDataSource } from "@/db";
import { NFT, Transaction } from "@/db/entities";
import ora from "ora";
import { IsNull, Not } from "typeorm";

export const waitUnconfirmedTxns = async (listed = true) => {
  const [nfts, total] = await AppDataSource.manager.findAndCount(NFT, {
    where: { listed: false, tx: Not(IsNull()) },
    relations: ["tx"],
  });

  if (total === 0) {
    return;
  }

  const spinner = ora("Waiting unconfirmed txns").start();

  for (const nft of nfts) {
    const provider = providers[nft.tx.chainId as ChainId];
    const tx = await provider.getTransaction(nft.tx.hash);
    await tx.wait();

    await AppDataSource.createQueryBuilder()
      .update(NFT)
      .set({ listed })
      .where({ tx: tx.hash })
      .execute();
  }

  spinner.succeed();
};
