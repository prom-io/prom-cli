import { approveCollection } from "@/cli/approveCollection";
import { ERC721ABI__factory } from "@/contracts";
import { Marketplace } from "@/marketplace";
import chai, { expect } from "chai";
import {
  deployMockContract,
  MockContract,
  MockProvider,
  solidity,
} from "ethereum-waffle";
import { ethers } from "ethers";

chai.use(solidity);

describe("cli | approveCollection", () => {
  const provider = new MockProvider({
    ganacheOptions: {
      chain: {
        hardfork: "arrowGlacier",
      },
    },
  });
  const [wallet] = provider.getWallets();
  let erc721contract: MockContract;

  beforeEach(async () => {
    erc721contract = await deployMockContract(wallet, ERC721ABI__factory.abi);

    await erc721contract.mock.setApprovalForAll.returns();
    await erc721contract.mock.isApprovedForAll.returns(false);
  });

  it("calls approve collection", async () => {
    await approveCollection(
      erc721contract.address,
      {
        address: ethers.constants.AddressZero,
        getGasOptions: () => Promise.resolve({}),
      } as Marketplace,
      wallet
    );

    expect("setApprovalForAll").to.be.calledOnContract(erc721contract);
  });

  it("doesn't call approve collection", async () => {
    await erc721contract.mock.isApprovedForAll.returns(true);

    await approveCollection(
      erc721contract.address,
      {
        address: ethers.constants.AddressZero,
        getGasOptions: () => Promise.resolve({}),
      } as Marketplace,
      wallet
    );

    expect("setApprovalForAll").not.to.be.calledOnContract(erc721contract);
  });
});
