import { Chain, Hex, createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const getWalletClient = (signingKey: Hex, chain: Chain) => {
  return createWalletClient({
    account: privateKeyToAccount(signingKey),
    chain,
    transport: http(),
  }).extend(publicActions);
};
