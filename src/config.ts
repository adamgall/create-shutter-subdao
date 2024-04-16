import "dotenv/config";
import { getAddress, isHex } from "viem";
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

  if (process.env.ENS_NAME === undefined) {
    console.error("ENS_NAME environment variable is missing!");
    process.exit(1);
  }

  const signingKey = process.env.SIGNING_KEY;
  const parentSafeAddress = getAddress(process.env.PARENT_SAFE_ADDRESS);
  const ensName = process.env.ENS_NAME;
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

  const ensNameWrapperAddress =
    chain === mainnet
      ? getAddress("0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401")
      : chain === sepolia
      ? getAddress("0x0635513f179D50A207757E05759CbD106d7dFcE8")
      : undefined;
  if (ensNameWrapperAddress === undefined) {
    console.error("ENS Name Wrapper address can't be set");
    process.exit(1);
  }

  const ensPublicResolverAddress =
    chain === mainnet
      ? getAddress("0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63")
      : chain === sepolia
      ? getAddress("0x8FADE66B79cC9f707aB26799354482EB93a5B7dD")
      : undefined;
  if (ensPublicResolverAddress === undefined) {
    console.error("ENS Public Resolver address can't be set");
    process.exit(1);
  }

  const ensIpfsHash = process.env.ENS_IPFS_HASH;
  if (ensIpfsHash === undefined) {
    console.error("ENS_IPFS_HASH environment variable is missing!");
    process.exit(1);
  }

  return {
    signingKey,
    parentSafeAddress,
    chain,
    ensName,
    ensNameWrapperAddress,
    ensPublicResolverAddress,
    ensIpfsHash,
  };
};
