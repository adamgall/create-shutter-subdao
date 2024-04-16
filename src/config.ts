import "dotenv/config";
import { readFileSync } from "fs";
import { getAddress, isHex } from "viem";
import { sepolia, mainnet } from "viem/chains";

export const getConfig = () => {
  if (process.env.DRY_RUN === undefined) {
    console.error("DRY_RUN environment variable is missing!");
    process.exit(1);
  }

  const dryRun =
    process.env.DRY_RUN === "true"
      ? true
      : process.env.DRY_RUN === "false"
      ? false
      : undefined;

  if (dryRun === undefined) {
    console.error(
      'DRY_RUN environment variable is malformed! Should be set to "true" or "false".'
    );
    process.exit(1);
  }

  if (process.env.SIGNING_KEY === undefined) {
    console.error("SIGNING_KEY environment variable is missing!");
    process.exit(1);
  }

  if (!isHex(process.env.SIGNING_KEY)) {
    console.error("SIGNING_KEY environment variable is malformed!");
    process.exit(1);
  }

  const signingKey = process.env.SIGNING_KEY;

  if (process.env.PARENT_SAFE_ADDRESS === undefined) {
    console.error("PARENT_SAFE_ADDRESS environment variable is missing!");
    process.exit(1);
  }

  if (!isHex(process.env.PARENT_SAFE_ADDRESS)) {
    console.error("PARENT_SAFE_ADDRESS environment variable is malformed!");
    process.exit(1);
  }

  const parentSafeAddress = getAddress(process.env.PARENT_SAFE_ADDRESS);

  if (process.env.CHAIN === undefined) {
    console.error("CHAIN environment variable is missing!");
    process.exit(1);
  }

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

  if (process.env.ENS_NAME === undefined) {
    console.error("ENS_NAME environment variable is missing!");
    process.exit(1);
  }

  const ensName = process.env.ENS_NAME;

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

  const proposalTitle = process.env.PROPOSAL_TITLE;
  if (proposalTitle === undefined) {
    console.error("PROPOSAL_TITLE environment variable is missing!");
    process.exit(1);
  }

  const proposalDescriptionFile = process.env.PROPOSAL_DESCRIPTION_FILE;
  if (proposalDescriptionFile === undefined) {
    console.error("PROPOSAL_DESCRIPTION_FILE environment variable is missing!");
    process.exit(1);
  }

  let proposalDescription;
  try {
    proposalDescription = JSON.stringify(
      readFileSync(`src/proposal-assets/${proposalDescriptionFile}`, "utf-8")
    );
  } catch (e) {
    console.error(
      `PROPOSAL_DESCRIPTION_FILE environment variable refers to an unknown file. Please create a file at "src/proposal-assets/${proposalDescriptionFile}" and fill it with your proposal description.`
    );
    process.exit(1);
  }

  const proposalDocumentationUrl = process.env.PROPOSAL_DOCUMENTATION_URL;
  if (proposalDocumentationUrl === undefined) {
    console.error(
      "PROPOSAL_DOCUMENTATION_URL environment variable is missing!"
    );
    process.exit(1);
  }

  return {
    dryRun,
    signingKey,
    parentSafeAddress,
    chain,
    ensName,
    ensNameWrapperAddress,
    ensPublicResolverAddress,
    ensIpfsHash,
    proposalTitle,
    proposalDescription,
    proposalDocumentationUrl,
  };
};
