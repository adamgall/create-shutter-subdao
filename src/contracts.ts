import { Address, PublicClient, getContract } from "viem";
import {
  GnosisSafeL2Abi,
  AzoriusAbi,
  EnsNameWrapperAbi,
  LinearERC20VotingStrategyAbi,
  GnosisSafeProxyFactoryAbi,
} from "./abis";

export const safeContract = (address: Address, client: PublicClient) => {
  return getContract({
    address,
    abi: GnosisSafeL2Abi,
    client,
  });
};

export const azoriusContract = (address: Address, client: PublicClient) => {
  return getContract({
    address,
    abi: AzoriusAbi,
    client,
  });
};

export const ensNameWrapperContract = (
  address: Address,
  client: PublicClient
) => {
  return getContract({
    address,
    abi: EnsNameWrapperAbi,
    client,
  });
};

export const linearVotingContract = (
  address: Address,
  client: PublicClient
) => {
  return getContract({
    address,
    abi: LinearERC20VotingStrategyAbi,
    client,
  });
};

export const gnosisSafeProxyFactoryContract = (
  address: Address,
  client: PublicClient
) => {
  return getContract({
    address: address,
    abi: GnosisSafeProxyFactoryAbi,
    client: client,
  });
};
