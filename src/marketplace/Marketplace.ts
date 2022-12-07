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

export class Marketplace {
  private readonly marketplace: TradeMarketplaceABI;

  constructor(address: string, signer: Signer) {
    this.marketplace = TradeMarketplaceABI__factory.connect(address, signer);
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
      type:
        (await this.marketplace.provider.getNetwork()).chainId ===
        ChainId.Polygon
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
}
