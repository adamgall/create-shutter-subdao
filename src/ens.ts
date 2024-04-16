import { namehash } from "@ensdomains/ensjs/utils";
import {
  Address,
  Chain,
  HttpTransport,
  PrivateKeyAccount,
  PublicActions,
  WalletClient,
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
