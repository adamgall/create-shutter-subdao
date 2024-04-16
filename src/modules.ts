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
import { AzoriusAbi, GnosisSafeL2Abi } from "./abis";
import { azoriusContract } from "./contracts";

export const getAllModulesOnSafe = async (
  safe: GetContractReturnType<
    typeof GnosisSafeL2Abi,
    WalletClient<HttpTransport, Chain, PrivateKeyAccount> &
      PublicActions<HttpTransport, Chain, PrivateKeyAccount>
  >,
  start?: Address
): Promise<`0x${string}`[]> => {
  const sentinel = pad("0x1", { size: 20 });

  if (start === undefined) {
    start = sentinel;
  }

  const paginated = await safe.read.getModulesPaginated([start, 0n]);
  const next = paginated[1];

  const allModules: `0x${string}`[] = [];

  if (next !== sentinel) {
    allModules.push(next);
    const modulesSoFar = await getAllModulesOnSafe(safe, next);
    allModules.push(...modulesSoFar);
  }

  return allModules;
};

export const findAzoriusModule = async (
  client: WalletClient<HttpTransport, Chain, PrivateKeyAccount> &
    PublicActions<HttpTransport, Chain, PrivateKeyAccount>,
  allModules: Address[]
) => {
  for (const module of allModules) {
    try {
      await client.multicall({
        contracts: [
          {
            address: module,
            abi: AzoriusAbi,
            functionName: "executionPeriod",
          },
          {
            address: module,
            abi: AzoriusAbi,
            functionName: "timelockPeriod",
          },
          {
            address: module,
            abi: AzoriusAbi,
            functionName: "totalProposalCount",
          },
        ],
        allowFailure: false,
      });
    } catch {
      // If we can't read those functions, this isn't the Azorius module.
      // On to the next one.
      continue;
    }

    return azoriusContract(module, client);
  }
};
