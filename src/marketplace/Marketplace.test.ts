import { ERC20__factory, TradeMarketplaceABI__factory } from "@/contracts";
import { Asset, Marketplace } from "@/marketplace/Marketplace";
import { expect } from "chai";
import dayjs from "dayjs";
import {
  deployMockContract,
  MockContract,
  MockProvider,
} from "ethereum-waffle";
import { ethers } from "ethers";

describe("marketplace | Marketplace", () => {
  let marketplace: Marketplace;
  let marketplaceContract: MockContract;
  const [wallet] = new MockProvider().getWallets();
  const assets: Asset[] = [
    {
      nftAddress: ethers.constants.AddressZero,
      tokenId: "12345",
    },
    {
      nftAddress: ethers.constants.AddressZero,
      tokenId: "123456",
    },
  ];

  const startDate = dayjs();
  const endDate = startDate.add(1, "year");

  beforeEach(async () => {
    marketplaceContract = await deployMockContract(
      wallet,
      TradeMarketplaceABI__factory.abi
    );

    await marketplaceContract.mock.multicallList.returns();

    marketplace = new Marketplace(marketplaceContract.address, wallet);
  });

  it("lists for ETH", async () => {
    await marketplace.multicallList(assets, {
      paymentTokenAddress: ethers.constants.AddressZero,
      price: "100",
      startDate,
      endDate,
    });

    expect("multicallList").to.be.calledOnContractWith(marketplaceContract, [
      [ethers.constants.AddressZero, ethers.constants.AddressZero],
      ["12345", "123456"],
      [1, 1],
      [ethers.constants.AddressZero, ethers.constants.AddressZero],
      [ethers.utils.parseEther("100"), ethers.utils.parseEther("100")],
      [startDate.unix(), startDate.unix()],
      [endDate.unix(), endDate.unix()],
    ]);
  });

  it("lists for ERC20", async () => {
    const erc20 = await deployMockContract(wallet, ERC20__factory.abi);
    await erc20.mock.decimals.returns(6);

    await marketplace.multicallList(assets, {
      paymentTokenAddress: erc20.address,
      price: "100",
      startDate,
      endDate,
    });

    expect("multicallList").to.be.calledOnContractWith(marketplaceContract, [
      [ethers.constants.AddressZero, ethers.constants.AddressZero],
      ["12345", "123456"],
      [1, 1],
      [erc20.address, erc20.address],
      [ethers.utils.parseUnits("100", 6), ethers.utils.parseUnits("100", 6)],
      [startDate.unix(), startDate.unix()],
      [endDate.unix(), endDate.unix()],
    ]);
  });
});
