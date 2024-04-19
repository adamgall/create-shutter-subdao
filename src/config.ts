import "dotenv/config";
import { readFileSync } from "fs";
import {
  Address,
  Chain,
  PublicClient,
  getAddress,
  isHex,
  namehash,
  parseEther,
} from "viem";
import { sepolia, mainnet } from "viem/chains";
import { confirmTokenOwnership, formatTokens } from "./funding";
import { getPublicClient } from "./clients";
import { ensNameWrapperContract } from "./contracts";

const getDryRun = () => {
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

  return dryRun;
};

const getSigningKey = () => {
  if (process.env.SIGNING_KEY === undefined) {
    console.error("SIGNING_KEY environment variable is missing!");
    process.exit(1);
  }

  const signingKey = process.env.SIGNING_KEY;

  if (!isHex(signingKey)) {
    console.error("SIGNING_KEY environment variable is malformed!");
    process.exit(1);
  }

  return signingKey;
};

const getParentSafeAddress = () => {
  if (process.env.PARENT_SAFE_ADDRESS === undefined) {
    console.error("PARENT_SAFE_ADDRESS environment variable is missing!");
    process.exit(1);
  }

  let parentSafeAddress;

  try {
    parentSafeAddress = getAddress(process.env.PARENT_SAFE_ADDRESS);
  } catch {
    console.error("PARENT_SAFE_ADDRESS environment variable is malformed!");
    process.exit(1);
  }

  return parentSafeAddress;
};

const getChain = () => {
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

  return chain;
};

const getEnsName = async (
  publicClient: PublicClient,
  ensNameWrapperAddress: Address,
  parentSafeAddress: Address
) => {
  const ensName = process.env.ENS_NAME;

  if (ensName === undefined) {
    console.error("ENS_NAME environment variable is missing!");
    process.exit(1);
  }

  const node = namehash(ensName);
  const nameWrapper = ensNameWrapperContract(
    ensNameWrapperAddress,
    publicClient
  );
  const ensOwnerAddress = await nameWrapper.read.ownerOf([BigInt(node)]);

  if (parentSafeAddress !== ensOwnerAddress) {
    console.error("ENS name not owned by parent Safe address!");
    process.exit(1);
  }

  return ensName;
};

const getEnsIpfsHash = () => {
  const ensIpfsHash = process.env.ENS_IPFS_HASH;

  if (ensIpfsHash === undefined) {
    console.error("ENS_IPFS_HASH environment variable is missing!");
    process.exit(1);
  }

  return ensIpfsHash;
};

const getProposalTitle = () => {
  const proposalTitle = process.env.PROPOSAL_TITLE;

  if (proposalTitle === undefined) {
    console.error("PROPOSAL_TITLE environment variable is missing!");
    process.exit(1);
  }

  return proposalTitle;
};

const getProposalDescription = () => {
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
      `PROPOSAL_DESCRIPTION_FILE environment variable refers to an unknown file.
      Please create a file at "src/proposal-assets/${proposalDescriptionFile}" and fill it with your proposal description.`
    );
    process.exit(1);
  }

  return proposalDescription;
};

const getProposalDocumentationUrl = () => {
  const proposalDocumentationUrl = process.env.PROPOSAL_DOCUMENTATION_URL;

  if (proposalDocumentationUrl === undefined) {
    console.error(
      "PROPOSAL_DOCUMENTATION_URL environment variable is missing!"
    );
    process.exit(1);
  }

  return proposalDocumentationUrl;
};

const getEnsNameWrapperAddress = (chain: Chain) => {
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

  return ensNameWrapperAddress;
};

const getEnsPublicResolverAddress = (chain: Chain) => {
  const ensPublicResolverAddress =
    chain === mainnet
      ? getAddress("0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63")
      : chain === sepolia
      ? getAddress("0x8FADE66B79cC9f707aB26799354482EB93a5B7dD")
      : undefined;
  if (ensPublicResolverAddress === undefined) {
    console.error("ENS Public Resolver address can't be set!");
    process.exit(1);
  }

  return ensPublicResolverAddress;
};

const getGnosisSafeProxyFactoryAddress = (chain: Chain) => {
  const gnosisSafeProxyFactoryAddress =
    chain === mainnet
      ? getAddress("0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2")
      : chain === sepolia
      ? getAddress("0xc22834581ebc8527d974f8a1c97e1bea4ef910bc")
      : undefined;
  if (gnosisSafeProxyFactoryAddress === undefined) {
    console.error("Gnosis Safe Proxy Factory address can't be set!");
    process.exit(1);
  }

  return gnosisSafeProxyFactoryAddress;
};

const getGnosisSafeL2SingletonAddress = (chain: Chain) => {
  const gnosisSafeL2SingletonAddress =
    chain === mainnet
      ? getAddress("0x3E5c63644E683549055b9Be8653de26E0B4CD36E")
      : chain === sepolia
      ? getAddress("0xfb1bffc9d739b8d520daf37df666da4c687191ea")
      : undefined;
  if (gnosisSafeL2SingletonAddress === undefined) {
    console.error("Gnosis Safe L2 Singleton address can't be set!");
    process.exit(1);
  }

  return gnosisSafeL2SingletonAddress;
};

const getModuleProxyFactoryAddress = (chain: Chain) => {
  const moduleProxyFactoryAddress =
    chain === mainnet
      ? getAddress("0x000000000000aDdB49795b0f9bA5BC298cDda236")
      : chain === sepolia
      ? getAddress("0x000000000000aDdB49795b0f9bA5BC298cDda236")
      : undefined;
  if (moduleProxyFactoryAddress === undefined) {
    console.error("Module Proxy Factory address can't be set!");
    process.exit(1);
  }

  return moduleProxyFactoryAddress;
};

const getFractalModuleMasterCopyAddress = (chain: Chain) => {
  const fractalModuleMasterCopyAddress =
    chain === mainnet
      ? getAddress("0x87326A981fc56823e26599Ff4D0A4eceAFfF3be0")
      : chain === sepolia
      ? getAddress("0x1b26345a4a41d9f588e1b161b6e8f21d27547184")
      : undefined;
  if (fractalModuleMasterCopyAddress === undefined) {
    console.error("Fractal Module Master Copy address can't be set!");
    process.exit(1);
  }

  return fractalModuleMasterCopyAddress;
};

const getMultiSendCallOnlyAddress = (chain: Chain) => {
  const multiSendCallOnlyAddress =
    chain === mainnet
      ? getAddress("0x40A2aCCbd92BCA938b02010E17A5b8929b49130D")
      : chain === sepolia
      ? getAddress("0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B")
      : undefined;
  if (multiSendCallOnlyAddress === undefined) {
    console.error("Multi Send Call Only address can't be set!");
    process.exit(1);
  }

  return multiSendCallOnlyAddress;
};

const getCompatibilityFallbackHandlerAddress = (chain: Chain) => {
  const compatibilityFallbackHandlerAddress =
    chain === mainnet
      ? getAddress("0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4")
      : chain === sepolia
      ? getAddress("0x017062a1dE2FE6b99BE3d9d37841FeD19F573804")
      : undefined;
  if (compatibilityFallbackHandlerAddress === undefined) {
    console.error("Compatibility Fallback Handler address can't be set!");
    process.exit(1);
  }

  return compatibilityFallbackHandlerAddress;
};

const getFractalRegistryAddress = (chain: Chain) => {
  const fractalRegistryAddress =
    chain === mainnet
      ? getAddress("0x023BDAEFeDDDdd5B43aF125CAA8007a99A886Fd3")
      : chain === sepolia
      ? getAddress("0x4791FF2a6E84F012402c0679C12Cb1d9260450A6")
      : undefined;
  if (fractalRegistryAddress === undefined) {
    console.error("Fractal Registry address can't be set!");
    process.exit(1);
  }

  return fractalRegistryAddress;
};

const getRealityModuleMasterCopyAddress = (chain: Chain) => {
  const realityModuleMasterCopyAddress =
    chain === mainnet
      ? getAddress("0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0")
      : chain === sepolia
      ? getAddress("0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0")
      : undefined;
  if (realityModuleMasterCopyAddress === undefined) {
    console.error("RealityModule Master Copy address can't be set!");
    process.exit(1);
  }

  return realityModuleMasterCopyAddress;
};

const getRealityOracleAddress = (chain: Chain) => {
  const realityOracleAddress =
    chain === mainnet
      ? getAddress("0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c")
      : chain === sepolia
      ? getAddress("0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA")
      : undefined;
  if (realityOracleAddress === undefined) {
    console.error("Reality Oracle address can't be set!");
    process.exit(1);
  }

  return realityOracleAddress;
};

const getRealityArbitratorAddress = (chain: Chain) => {
  const realityArbitratorAddress =
    chain === mainnet
      ? getAddress("0xf72cfd1b34a91a64f9a98537fe63fbab7530adca")
      : chain === sepolia
      ? getAddress("0x05b942faecfb3924970e3a28e0f230910cedff45")
      : undefined;
  if (realityArbitratorAddress === undefined) {
    console.error("Reality Arbitrator address can't be set!");
    process.exit(1);
  }

  return realityArbitratorAddress;
};

const getChildSafeMultisigOwners = () => {
  const ownersRaw = process.env.CHILD_SAFE_MULTISIG_OWNERS;

  if (ownersRaw === undefined) {
    console.error(
      "CHILD_SAFE_MULTISIG_OWNERS environment variable is missing!"
    );
    process.exit(1);
  }

  let owners;

  try {
    owners = ownersRaw
      .split(",")
      .map((owner) => owner.trim())
      .map((owner) => getAddress(owner));
  } catch {
    console.error(
      "CHILD_SAFE_MULTISIG_OWNERS environment variable has an invalid address in it!"
    );
    process.exit(1);
  }

  if (owners.length === 0) {
    console.error(
      "CHILD_SAFE_MULTISIG_OWNERS environment variable is malformed, no addresses present!"
    );
    process.exit(1);
  }

  return owners;
};

const getChildSafeMultisigThreshold = (owners: Address[]) => {
  const thresholdRaw = process.env.CHILD_SAFE_MULTISIG_THRESHOLD;

  if (thresholdRaw === undefined) {
    console.error(
      "CHILD_SAFE_MULTISIG_THRESHOLD environment variable is missing!"
    );
    process.exit(1);
  }

  let threshold;

  try {
    threshold = BigInt(thresholdRaw);
  } catch {
    console.error("CHILD_SAFE_MULTISIG_THRESHOLD is not a valid integer!");
    process.exit(1);
  }

  if (threshold > BigInt(owners.length)) {
    console.error(
      "CHILD_SAFE_MULTISIG_THRESHOLD cannot be greater than the number of CHILD_SAFE_MULTISIG_OWNERS!"
    );
    process.exit(1);
  }

  return threshold;
};

const getChildSafeName = () => {
  const childSafeName = process.env.CHILD_SAFE_NAME;

  if (childSafeName === undefined) {
    console.error("CHILD_SAFE_NAME environment variable is missing!");
    process.exit(1);
  }

  return childSafeName;
};

const getFundingTokens = async (
  publicClient: PublicClient,
  parentSafeAddress: Address
) => {
  const fundingAddressesRaw = process.env.FUNDING_ERC20_ADDRESSES;
  const fundingAmountsRaw = process.env.FUNDING_ERC20_AMOUNTS;

  if (fundingAddressesRaw === undefined) {
    console.error("FUNDING_ERC20_ADDRESSES environment variable is missing!");
    process.exit(1);
  }

  if (fundingAmountsRaw === undefined) {
    console.error("FUNDING_ERC20_AMOUNTS environment variable is missing!");
    process.exit(1);
  }

  let fundingAddresses;

  try {
    fundingAddresses = fundingAddressesRaw
      .split(",")
      .map((address) => address.trim())
      .map((address) => getAddress(address));
  } catch {
    console.error(
      "FUNDING_ERC20_ADDRESSES environment variable has an invalid address in it!"
    );
    process.exit(1);
  }

  const fundingAmounts = fundingAmountsRaw
    .split(",")
    .map((amount) => amount.trim());

  if (fundingAddresses.length === 0) {
    console.error(
      "FUNDING_ERC20_ADDRESSES environment variable is malformed, no addresses present!"
    );
    process.exit(1);
  }

  if (fundingAmounts.length === 0) {
    console.error(
      "FUNDING_ERC20_AMOUNTS environment variable is malformed, no addresses present!"
    );
    process.exit(1);
  }

  if (fundingAmounts.length !== fundingAddresses.length) {
    console.error(
      "FUNDING_ERC20_ADDRESSES and FUNDING_ERC20_AMOUNTS environment variables are different lengths!"
    );
    process.exit(1);
  }

  const fundingTokens = await formatTokens(
    fundingAddresses,
    fundingAmounts,
    publicClient
  );

  await confirmTokenOwnership(parentSafeAddress, fundingTokens, publicClient);

  return fundingTokens;
};

const getRealityTemplateId = () => {
  const realityTemplateIdRaw = process.env.REALITY_TEMPLATE_ID;

  if (realityTemplateIdRaw === undefined) {
    console.error("REALITY_TEMPLATE_ID environment variable is missing!");
    process.exit(1);
  }

  let realityTemplateId;

  try {
    realityTemplateId = BigInt(realityTemplateIdRaw);
  } catch {
    console.error(
      "REALITY_TEMPLATE_ID environment variable is not a valid number!"
    );
    process.exit(1);
  }

  return realityTemplateId;
};

const getRealityMinimumBond = () => {
  const realityMinimumBondRaw = process.env.REALITY_MINIMUM_BOND;

  if (realityMinimumBondRaw === undefined) {
    console.error("REALITY_MINIMUM_BOND environment variable is missing!");
    process.exit(1);
  }

  let realityMinimumBond;

  try {
    realityMinimumBond = parseEther(realityMinimumBondRaw);
  } catch {
    console.error(
      "REALITY_MINIMUM_BOND environment variable is not a valid number!"
    );
    process.exit(1);
  }

  return realityMinimumBond;
};

const getRealityQuestionTimeout = () => {
  const realityQuestionTimeoutRaw = process.env.REALITY_QUESTION_TIMEOUT;

  if (realityQuestionTimeoutRaw === undefined) {
    console.error("REALITY_QUESTION_TIMEOUT environment variable is missing!");
    process.exit(1);
  }

  let realityQuestionTimeout;

  try {
    realityQuestionTimeout = parseInt(realityQuestionTimeoutRaw);
  } catch {
    console.error(
      "REALITY_QUESTION_TIMEOUT environment variable is not a valid number!"
    );
    process.exit(1);
  }

  return realityQuestionTimeout;
};

const getRealityQuestionCooldown = () => {
  const realityQuestionCooldownRaw = process.env.REALITY_QUESTION_COOLDOWN;

  if (realityQuestionCooldownRaw === undefined) {
    console.error("REALITY_QUESTION_COOLDOWN environment variable is missing!");
    process.exit(1);
  }

  let realityQuestionCooldown;

  try {
    realityQuestionCooldown = parseInt(realityQuestionCooldownRaw);
  } catch {
    console.error(
      "REALITY_QUESTION_COOLDOWN environment variable is not a valid number!"
    );
    process.exit(1);
  }

  return realityQuestionCooldown;
};

const getRealityAnswerExpiration = () => {
  const realityAnswerExpirationRaw = process.env.REALITY_ANSWER_EXPIRATION;

  if (realityAnswerExpirationRaw === undefined) {
    console.error("REALITY_ANSWER_EXPIRATION environment variable is missing!");
    process.exit(1);
  }

  let realityAnswerExpiration;

  try {
    realityAnswerExpiration = parseInt(realityAnswerExpirationRaw);
  } catch {
    console.error(
      "REALITY_ANSWER_EXPIRATION environment variable is not a valid number!"
    );
    process.exit(1);
  }

  return realityAnswerExpiration;
};

export const getConfig = async () => {
  const dryRun = getDryRun();

  const chain = getChain();
  const publicClient = getPublicClient(chain);
  const signingKey = getSigningKey();

  const parentSafeAddress = getParentSafeAddress();

  const proposalTitle = getProposalTitle();
  const proposalDescription = getProposalDescription();
  const proposalDocumentationUrl = getProposalDocumentationUrl();

  const ensNameWrapperAddress = getEnsNameWrapperAddress(chain);
  const ensPublicResolverAddress = getEnsPublicResolverAddress(chain);
  const gnosisSafeProxyFactoryAddress = getGnosisSafeProxyFactoryAddress(chain);
  const gnosisSafeL2SingletonAddress = getGnosisSafeL2SingletonAddress(chain);
  const moduleProxyFactoryAddress = getModuleProxyFactoryAddress(chain);
  const fractalModuleMasterCopyAddress =
    getFractalModuleMasterCopyAddress(chain);
  const multiSendCallOnlyAddress = getMultiSendCallOnlyAddress(chain);
  const compatibilityFallbackHandlerAddress =
    getCompatibilityFallbackHandlerAddress(chain);
  const fractalRegistryAddress = getFractalRegistryAddress(chain);
  const realityModuleMasterCopyAddress =
    getRealityModuleMasterCopyAddress(chain);
  const realityOracleAddress = getRealityOracleAddress(chain);
  const realityArbitratorAddress = getRealityArbitratorAddress(chain);

  const ensName = await getEnsName(
    publicClient,
    ensNameWrapperAddress,
    parentSafeAddress
  );
  const ensIpfsHash = getEnsIpfsHash();

  const childSafeName = getChildSafeName();
  const childSafeMultisigOwners = getChildSafeMultisigOwners();
  const childSafeMultisigThreshold = getChildSafeMultisigThreshold(
    childSafeMultisigOwners
  );

  const fundingTokens = await getFundingTokens(publicClient, parentSafeAddress);

  const realityTemplateId = getRealityTemplateId();
  const realityMinimumBond = getRealityMinimumBond();
  const realityQuestionTimeout = getRealityQuestionTimeout();
  const realityQuestionCooldown = getRealityQuestionCooldown();
  const realityAnswerExpiration = getRealityAnswerExpiration();

  console.log("User provided environment variables:");
  console.table([
    { property: "DRY RUN", value: dryRun },
    { property: "Chain", value: chain.name },
    {
      property: "Parent Safe address",
      value: parentSafeAddress,
    },
    { property: "ENS name", value: ensName },
    { property: "ENS IPFS hash", value: ensIpfsHash },
    { property: "Proposal title", value: proposalTitle },
    {
      property: "Proposal description",
      value: `${proposalDescription.substring(0, 50)}...`,
    },
    {
      property: "Proposal documentation URL",
      value: proposalDocumentationUrl,
    },
    {
      property: "Child Safe name",
      value: childSafeName,
    },
    ...childSafeMultisigOwners.map((owner, i) => ({
      property: `Child Safe multisig owner #${i + 1}`,
      value: owner,
    })),
    {
      property: "Child Safe multisig threshold",
      value: childSafeMultisigThreshold.toString(),
    },
    ...fundingTokens.map((token, i) => ({
      property: `Funding address #${i + 1}`,
      value: token.address,
    })),
    ...fundingTokens.map((token, i) => ({
      property: `Funding amount (full units) #${i + 1}`,
      value: token.amount.toString(),
    })),
    {
      property: "Reality template ID",
      value: realityTemplateId.toString(),
    },
    {
      property: "Reality minimum bond (full units)",
      value: realityMinimumBond.toString(),
    },
    {
      property: "Reality question timeout (seconds)",
      value: realityQuestionCooldown,
    },
    {
      property: "Reality question cooldown (seconds)",
      value: realityQuestionCooldown,
    },
    {
      property: "Reality answer expiration (seconds)",
      value: realityAnswerExpiration,
    },
  ]);
  console.log("");

  console.log(`Network specific (${chain.name}) contract addresses:`);
  console.table([
    {
      property: "ENS Name Wrapper address",
      value: ensNameWrapperAddress,
    },
    {
      property: "ENS Public Resolver address",
      value: ensPublicResolverAddress,
    },
    {
      property: "FractalModule Master Copy address",
      value: fractalModuleMasterCopyAddress,
    },
    {
      property: "FractalRegistry address",
      value: fractalRegistryAddress,
    },
    {
      property: "MultiSendCallOnly address",
      value: multiSendCallOnlyAddress,
    },
    {
      property: "ModuleProxyFactory address",
      value: moduleProxyFactoryAddress,
    },
    {
      property: "GnosisSafeL2 Singleton address",
      value: gnosisSafeL2SingletonAddress,
    },
    {
      property: "GnosisSafeProxyFactory address",
      value: gnosisSafeProxyFactoryAddress,
    },
    {
      property: "CompatibilityFallbackHandler address",
      value: compatibilityFallbackHandlerAddress,
    },
    {
      property: "RealityModule Master Copy address",
      value: realityModuleMasterCopyAddress,
    },
    {
      property: "Reality Oracle address",
      value: realityOracleAddress,
    },
    {
      property: "Reality DAO Arbitrator address",
      value: realityArbitratorAddress,
    },
  ]);
  console.log("");

  return {
    publicClient,
    dryRun,
    network: {
      chain,
      signingKey,
    },
    parentSafe: {
      parentSafeAddress,
      fundingTokens,
    },
    childSafe: {
      childSafeName,
      childSafeMultisigOwners,
      childSafeMultisigThreshold,
    },
    contractAddresses: {
      ens: {
        ensNameWrapperAddress,
        ensPublicResolverAddress,
      },
      fractal: {
        fractalRegistryAddress,
      },
      safe: {
        multiSendCallOnlyAddress,
        gnosisSafeL2SingletonAddress,
        gnosisSafeProxyFactoryAddress,
        compatibilityFallbackHandlerAddress,
      },
      zodiac: {
        moduleProxyFactoryAddress,
        fractalModuleMasterCopyAddress,
        realityModuleMasterCopyAddress,
      },
    },
    ensData: {
      ensName,
      ensIpfsHash,
    },
    proposalData: {
      proposalTitle,
      proposalDescription,
      proposalDocumentationUrl,
    },
    realityData: {
      realityOracle: realityOracleAddress,
      realityTemplateId: realityTemplateId,
      realityMinimumBond: realityMinimumBond,
      realityQuestionTimeout: realityQuestionTimeout,
      realityQuestionCooldown: realityQuestionCooldown,
      realityQuestionArbitrator: realityArbitratorAddress,
      realityAnswerExpiration: realityAnswerExpiration,
    },
  };
};
