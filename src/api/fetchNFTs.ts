import axios from "axios";

export const fetchNFTs = async (
  gameContract: string,
  ownerAddress: string,
  chainId: number,
  first: number = 1000,
  skip: number = 0
) => {
  const { data } = await axios.post("https://prom.io/stitched-api", {
    query: `
        query GetTokens($where: ERC721Token_filter, $first: Int, $skip: Int) {
          erc721Tokens_${chainId}(where: $where, first: $first, skip: $skip) {
            id
            identifier

            nftById {
              tradeListing {
                published
                contract
              }
            }
          }
        }
            `,
    variables: {
      first,
      skip,
      where: {
        owner: ownerAddress.toLowerCase(),
        contract: gameContract.toLowerCase(),
      },
    },
  });

  return data?.data?.[`erc721Tokens_${chainId}`] as
    | {
        id: string;
        identifier: string;
        nftById: {
          tradeListing?: {
            published: boolean;
            contract: string;
          }[];
        };
      }[];
};
