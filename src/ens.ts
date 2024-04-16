import { Address, Chain, HttpTransport, PublicClient, namehash } from "viem";
import { ensNameWrapperContract } from "./contracts";

export const ensOwner = async (
  name: string,
  nameWrapperAddress: Address,
  client: PublicClient<HttpTransport, Chain>
) => {
  const node = namehash(name);
  const nameWrapper = ensNameWrapperContract(nameWrapperAddress, client);
  return await nameWrapper.read.ownerOf([BigInt(node)]);
};
