import "dotenv/config";
import { isHex } from "viem";
import { sepolia, mainnet } from "viem/chains";

export const getConfig = () => {
  if (process.env.SIGNING_KEY === undefined) {
    console.error("SIGNING_KEY environment variable is missing!");
    process.exit(1);
  }

  if (!isHex(process.env.SIGNING_KEY)) {
    console.error("SIGNING_KEY environment variable is malformed!");
    process.exit(1);
  }

  if (process.env.PARENT_SAFE_ADDRESS === undefined) {
    console.error("PARENT_SAFE_ADDRESS environment variable is missing!");
    process.exit(1);
  }

  if (!isHex(process.env.PARENT_SAFE_ADDRESS)) {
    console.error("PARENT_SAFE_ADDRESS environment variable is malformed!");
    process.exit(1);
  }

  if (process.env.CHAIN === undefined) {
    console.error("CHAIN environment variable is missing!");
    process.exit(1);
  }

  const signingKey = process.env.SIGNING_KEY;
  const parentSafeAddress = process.env.PARENT_SAFE_ADDRESS;
  const chain =
    process.env.CHAIN === "mainnet"
      ? mainnet
      : process.env.CHAIN === "sepolia"
      ? sepolia
      : undefined;
  if (chain === undefined) {
    console.error("CHAIN environment variable is malformed!");
    process.exit(1);
  }

  return {
    signingKey,
    parentSafeAddress,
    chain,
  };
};
