import {
  Address,
  Chain,
  HttpTransport,
  PrivateKeyAccount,
  PublicActions,
  WalletClient,
  encodeFunctionData,
  namehash,
} from "viem";
import { ensNameWrapperContract } from "./contracts";

export const ensOwner = async (
  name: string,
  nameWrapperAddress: Address,
  client: WalletClient<HttpTransport, Chain, PrivateKeyAccount> &
    PublicActions<HttpTransport, Chain, PrivateKeyAccount>
) => {
  const node = namehash(name);
  const nameWrapper = ensNameWrapperContract(nameWrapperAddress, client);
  return await nameWrapper.read.ownerOf([BigInt(node)]);
};

export const createEnsTransaction = (
  ensPublicResolverAddress: Address,
  ensName: string,
  ensIPFSHash: string
) => {
  const to = ensPublicResolverAddress;
  const value = 0n;
  const data = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "node", type: "bytes32" },
          { name: "key", type: "string" },
          { name: "value", type: "string" },
        ],
        name: "setText",
        outputs: [],
        stateMutability: "public",
        type: "function",
      },
    ],
    args: [namehash(ensName), "daorequirements", `ipfs://${ensIPFSHash}`],
  });
  const operation = 0;
  return { to, value, data, operation };
};
