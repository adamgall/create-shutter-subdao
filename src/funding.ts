import { Address, PublicClient, erc20Abi, parseUnits } from "viem";

export const formatTokens = async (
  addresses: Address[],
  amounts: string[],
  client: PublicClient
) => {
  let decimals;

  try {
    decimals = await client.multicall({
      contracts: [
        ...addresses.map((address) => {
          return {
            address,
            abi: erc20Abi,
            functionName: "decimals",
          };
        }),
      ],
      allowFailure: false,
    });
  } catch {
    console.error(
      "Wasn't able to fetch `decimals` for one or more token addresses!"
    );
    process.exit(1);
  }

  const tokens = addresses.map((address, i) => ({
    address,
    amount: parseUnits(amounts[i], decimals[i] as number),
  }));

  return tokens;
};

export const confirmTokenOwnership = async (
  owner: Address,
  tokens: { address: Address; amount: bigint }[],
  client: PublicClient
) => {
  let balances;

  try {
    balances = await client.multicall({
      contracts: [
        ...tokens.map((token) => {
          return {
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [owner],
          };
        }),
      ],
      allowFailure: false,
    });
  } catch {
    console.error(
      "Wasn't able to get token balance for parent Safe for one or more token addresses!"
    );
    process.exit(1);
  }

  if (tokens.some((token, i) => token.amount > (balances[i] as bigint))) {
    console.error("Parent Safe doesn't own enough of at least one token!");
    process.exit(1);
  }
};
