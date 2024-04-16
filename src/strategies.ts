import {
  Address,
  Chain,
  GetContractReturnType,
  HttpTransport,
  PrivateKeyAccount,
  PublicActions,
  WalletClient,
  pad,
} from "viem";
import { AzoriusAbi, LinearERC20VotingStrategyAbi } from "./abis";
import { linearVotingContract } from "./contracts";

export const getAllStrategiesOnAzorius = async (
  azorius: GetContractReturnType<
    typeof AzoriusAbi,
    WalletClient<HttpTransport, Chain, PrivateKeyAccount> &
      PublicActions<HttpTransport, Chain, PrivateKeyAccount>
  >,
  start?: Address
): Promise<`0x${string}`[]> => {
  const sentinel = pad("0x1", { size: 20 });

  if (start === undefined) {
    start = sentinel;
  }

  const paginated = await azorius.read.getStrategies([start, 0n]);
  const next = paginated[1];

  const allStrategies: `0x${string}`[] = [];

  if (next !== sentinel) {
    allStrategies.push(next);
    const modulesSoFar = await getAllStrategiesOnAzorius(azorius, next);
    allStrategies.push(...modulesSoFar);
  }

  return allStrategies;
};

export const findVotingStrategy = async (
  client: WalletClient<HttpTransport, Chain, PrivateKeyAccount> &
    PublicActions<HttpTransport, Chain, PrivateKeyAccount>,
  allStrategies: Address[]
) => {
  for (const strategy of allStrategies) {
    try {
      await client.multicall({
        contracts: [
          {
            address: strategy,
            abi: LinearERC20VotingStrategyAbi,
            functionName: "BASIS_DENOMINATOR",
          },
          {
            address: strategy,
            abi: LinearERC20VotingStrategyAbi,
            functionName: "QUORUM_DENOMINATOR",
          },
          {
            address: strategy,
            abi: LinearERC20VotingStrategyAbi,
            functionName: "azoriusModule",
          },
          {
            address: strategy,
            abi: LinearERC20VotingStrategyAbi,
            functionName: "basisNumerator",
          },
          {
            address: strategy,
            abi: LinearERC20VotingStrategyAbi,
            functionName: "governanceToken",
          },
          {
            address: strategy,
            abi: LinearERC20VotingStrategyAbi,
            functionName: "quorumNumerator",
          },
          {
            address: strategy,
            abi: LinearERC20VotingStrategyAbi,
            functionName: "requiredProposerWeight",
          },
          {
            address: strategy,
            abi: LinearERC20VotingStrategyAbi,
            functionName: "votingPeriod",
          },
        ],
        allowFailure: false,
      });
    } catch {
      // If we can't read those functions, this isn't the voting strategy.
      // On to the next one.
      continue;
    }

    return linearVotingContract(strategy, client);
  }
};
