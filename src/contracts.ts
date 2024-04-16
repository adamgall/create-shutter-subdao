import {
  Address,
  Chain,
  HttpTransport,
  PrivateKeyAccount,
  PublicClient,
  WalletClient,
  getContract,
} from "viem";
import {
  GnosisSafeL2Abi,
  AzoriusAbi,
  EnsNameWrapperAbi,
  LinearERC20VotingStrategyAbi,
} from "./abis";

export const safeContract = (
  address: Address,
  client: PublicClient<HttpTransport, Chain>
) => {
  return getContract({
    address,
    abi: GnosisSafeL2Abi,
    client,
  });
};

export const azoriusContract = (
  address: Address,
  client: PublicClient<HttpTransport, Chain>
) => {
  return getContract({
    address,
    abi: AzoriusAbi,
    client,
  });
};

export const azoriusContractWriteable = (
  address: Address,
  client: WalletClient<HttpTransport, Chain, PrivateKeyAccount>
) => {
  return getContract({
    address,
    abi: AzoriusAbi,
    client,
  });
};

export const ensNameWrapperContract = (
  address: Address,
  client: PublicClient<HttpTransport, Chain>
) => {
  return getContract({
    address,
    abi: EnsNameWrapperAbi,
    client,
  });
};

export const linearVotingContract = (
  address: Address,
  client: PublicClient<HttpTransport, Chain>
) => {
  return getContract({
    address,
    abi: LinearERC20VotingStrategyAbi,
    client,
  });
};
