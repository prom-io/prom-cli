import { config, signaleLogger } from "@/config";
import { ethers, Wallet } from "ethers";
import ora from "ora";

const logger = signaleLogger.scope("cancel pending txns");

export const cancelPendingTxns = async (wallet: Wallet) => {
  const currentNonce = await wallet.getTransactionCount();
  const pendingNonce = await wallet.getTransactionCount("pending");
  const chainId = await wallet.getChainId();

  logger.info(`Current nonce: ${currentNonce}`);
  logger.info(`Pending nonce: ${pendingNonce}`);

  const response = await fetch(`https://api.owlracle.info/v3/${chainId}/gas`);
  const data = await response.json();
  const [, , , fastest] = data.speeds;

  for (let nonce = currentNonce; nonce < pendingNonce; nonce++) {
    const spinner = ora({
      isSilent: !config.isLoggingEnabled,
      text: `Canceling tx with nonce ${nonce}`,
    });

    const txOptions =
      "gasPrice" in fastest
        ? {
            gasPrice: ethers.utils.parseUnits(
              fastest.gasPrice.toString(),
              "gwei"
            ),
          }
        : {
            type: 2,
            maxFeePerGas: ethers.utils.parseUnits(
              fastest.maxFeePerGas.toString(),
              "gwei"
            ),
            maxPriorityFeePerGas: ethers.utils.parseUnits(
              fastest.maxPriorityFeePerGas.toString(),
              "gwei"
            ),
          };

    const tx = await wallet.sendTransaction({
      to: wallet.address,
      nonce,
      ...txOptions,
    });

    spinner.info(`Tx hash: ${tx.hash}`);

    await tx.wait();

    spinner.succeed();
  }
};
