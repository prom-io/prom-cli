import { ChainId, config, signaleLogger } from "@/config";
import { ERC721ABI__factory } from "@/contracts";
import { Marketplace } from "@/marketplace";
import { Wallet } from "ethers";
import ora from "ora";

const logger = signaleLogger.scope("Approve collection");

export const approveCollection = async (
  collection: string,
  marketplace: Marketplace,
  wallet: Wallet
) => {
  const spinner = ora({
    isSilent: !config.isLoggingEnabled,
    text: "Approving collection",
  });

  const erc721 = ERC721ABI__factory.connect(collection, wallet);

  const isApproved = await erc721.isApprovedForAll(
    wallet.address,
    marketplace.address
  );

  if (!isApproved) {
    spinner.start();

    await erc721.estimateGas.setApprovalForAll(marketplace.address, true);
    const tx = await erc721.setApprovalForAll(marketplace.address, true, {
      ...(await marketplace.getTxOptions()),
    });

    spinner.info(`Tx hash: ${tx.hash}`);
    logger.debug("Raw tx", JSON.stringify(tx, null, 2));

    await tx.wait();
    spinner.succeed();
  } else {
    signaleLogger.success("ERC721 is approved for marketplace");
  }
};
