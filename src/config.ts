import "dotenv/config";
import { readFileSync } from "fs";
import { Address, Chain, getAddress, isHex } from "viem";
import { sepolia, mainnet } from "viem/chains";

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

const getEnsName = () => {
  const ensName = process.env.ENS_NAME;

  if (ensName === undefined) {
    console.error("ENS_NAME environment variable is missing!");
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
      ? getAddress("0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237")
      : chain === sepolia
      ? getAddress("0xe93e4b198097c4cb3a6de594c90031cdac0b88f3")
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

  const threshold = BigInt(thresholdRaw);

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

export const getConfig = () => {
  const dryRun = getDryRun();

  const chain = getChain();
  const signingKey = getSigningKey();

  const parentSafeAddress = getParentSafeAddress();

  const ensName = getEnsName();
  const ensIpfsHash = getEnsIpfsHash();

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

  const childSafeName = getChildSafeName();
  const childSafeMultisigOwners = getChildSafeMultisigOwners();
  const childSafeMultisigThreshold = getChildSafeMultisigThreshold(
    childSafeMultisigOwners
  );

  return {
    dryRun,
    network: {
      chain,
      signingKey,
    },
    childSafe: {
      childSafeName,
      childSafeMultisigOwners,
      childSafeMultisigThreshold,
    },
    contractAddresses: {
      user: {
        parentSafeAddress,
      },
      ens: {
        ensNameWrapperAddress,
        ensPublicResolverAddress,
      },
      fractal: {
        fractalModuleMasterCopyAddress,
        fractalRegistryAddress,
      },
      safe: {
        multiSendCallOnlyAddress,
        moduleProxyFactoryAddress,
        gnosisSafeL2SingletonAddress,
        gnosisSafeProxyFactoryAddress,
        compatibilityFallbackHandlerAddress,
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
  };
};
