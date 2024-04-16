import { Chain, Hex, createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const getWalletClient = (signingKey: Hex, chain: Chain) => {
  return createWalletClient({
    account: privateKeyToAccount(signingKey),
    chain,
    transport: http(),
  });
};

export const getPublicClient = (chain: Chain) => {
  return createPublicClient({
    chain,
    transport: http(),
  });
};
