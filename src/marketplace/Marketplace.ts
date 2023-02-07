import { ChainId, signaleLogger } from "@/config";
import { TradeMarketplaceABI, TradeMarketplaceABI__factory } from "@/contracts";
import { ERC20__factory } from "@/contracts/factories/ERC20__factory";
import { Dayjs } from "dayjs";
import { ethers, Signer } from "ethers";

export type Asset = {
  nftAddress: string;
  tokenId: string;
};

export type MulticallListOptions = {
  paymentTokenAddress: string;
  price: string;
  startDate: Dayjs;
  endDate: Dayjs;
};

const logger = signaleLogger.scope("Marketplace");

type MarketplaceOptions = {
  maxFee?: number;
  maxPriorityFee?: number;
  speed?: "fastest" | "fast" | "medium" | "slow";
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class Marketplace {
  private readonly marketplace: TradeMarketplaceABI;

  constructor(
    address: string,
    signer: Signer,
    private readonly options?: MarketplaceOptions
  ) {
    this.marketplace = TradeMarketplaceABI__factory.connect(address, signer);
    logger.debug("address", this.marketplace.address);
  }

  get address() {
    return this.marketplace.address;
  }

  async multicallList(
    assets: Asset[],
    {
      price,
      paymentTokenAddress,
      startDate: startTimestamp,
      endDate: endTimestamp,
    }: MulticallListOptions
  ) {
    const fillArray = <T extends any>(value: T): T[] =>
      Array.from({ length: assets.length }).fill(value) as T[];

    const args = [
      assets.map(it => it.nftAddress),
      assets.map(it => it.tokenId),
      fillArray(1),
      fillArray(paymentTokenAddress),
      fillArray(await this.formatPrice(paymentTokenAddress, price)),
      fillArray(startTimestamp.unix()),
      fillArray(endTimestamp.unix()),
    ] as const;

    logger.debug("multicallList args", args);

    await this.marketplace.estimateGas.multicallList(...args);

    return this.marketplace.multicallList(...args, {
      ...(await this.getGasOptions()),
      type:
        (await this.marketplace.provider.getNetwork()).chainId === ChainId.BSC
          ? 1
          : 2,
    });
  }

  async multicallCancel(assets: Asset[]) {
    const args = [
      assets.map(it => it.nftAddress),
      assets.map(it => it.tokenId),
    ] as const;

    await this.marketplace.estimateGas.multicallCancel(...args);

    return this.marketplace.multicallCancel(...args, {
      ...(await this.getGasOptions()),
      type:
        (await this.marketplace.provider.getNetwork()).chainId === ChainId.BSC
          ? 1
          : 2,
    });
  }

  async isListed(asset: Asset) {
    logger.debug("isListed args", [
      asset.nftAddress,
      asset.tokenId,
      await this.marketplace.signer.getAddress(),
    ]);

    const [quantity] = await this.marketplace.listings(
      asset.nftAddress,
      asset.tokenId,
      await this.marketplace.signer.getAddress()
    );

    logger.debug("quantity", quantity);

    return Boolean(quantity.toNumber());
  }

  private async formatPrice(paymentToken: string, price: string) {
    if (paymentToken === ethers.constants.AddressZero) {
      logger.debug("Payment token is ETH");
      return ethers.utils.parseEther(price);
    }

    const erc20 = ERC20__factory.connect(
      paymentToken,
      this.marketplace.signer.provider!
    );

    const decimals = await erc20.decimals();

    logger.debug(
      "Payment token is ERC20",
      paymentToken,
      `decimals ${decimals}`
    );

    return ethers.utils.parseUnits(price, decimals);
  }

  async getGasOptions(): Promise<ethers.Overrides> {
    const chainId = (await this.marketplace.provider.getNetwork()).chainId;

    try {
      const response = await fetch(
        `https://api.owlracle.info/v3/${chainId}/gas`
      );
      const data = await response.json();
      const [slow, medium, fast, fastest] = data.speeds;
      const speed = { slow, medium, fast, fastest }[
        this.options?.speed ?? "medium"
      ];

      if ("gasPrice" in speed) {
        if (this.options?.maxFee && speed.gasPrice > this.options.maxFee) {
          throw new Error(
            `Gas price is higher than "maxFee" option. ${speed.gasPrice} > ${this.options.maxFee}`
          );
        }

        return {
          gasPrice: ethers.utils.parseUnits(speed.gasPrice.toString(), "gwei"),
        };
      } else {
        if (this.options?.maxFee && speed.maxFeePerGas > this.options.maxFee) {
          throw new Error(
            `maxFeePerGas is higher than "maxFee" option. ${speed.maxFeePerGas} > ${this.options.maxFee}`
          );
        }

        if (
          this.options?.maxPriorityFee &&
          speed.maxPriorityFeePerGas > this.options.maxPriorityFee
        ) {
          throw new Error(
            `maxPriorityFeePerGas is higher than "maxPriorityFee" option. ${speed.maxPriorityFeePerGas} > ${this.options.maxPriorityFee}`
          );
        }

        return {
          maxFeePerGas: ethers.utils.parseUnits(
            speed.maxFeePerGas.toString(),
            "gwei"
          ),
          maxPriorityFeePerGas: ethers.utils.parseUnits(
            speed.maxPriorityFeePerGas.toString(),
            "gwei"
          ),
        };
      }
    } catch (e: any) {
      logger.warn(e?.message || "Failed to get gas options");
      logger.debug(e);
      logger.warn("Retrying in 10 seconds...");
      await sleep(10000);
      return this.getGasOptions();
    }
  }
}
