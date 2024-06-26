import { Address, PublicClient, namehash } from "viem";
import { getConfigRaw } from "./configParsing";
import { getPublicClient } from "./clients";
import { confirmTokenOwnership, formatTokens } from "./funding";
import { readFileSync } from "fs";
import { ensNameWrapperContract } from "./contracts";

const checkMultisigThreshold = (
  childSafeMultisigThreshold: bigint,
  childSafeMultisigOwners: Address[]
) => {
  if (childSafeMultisigThreshold > BigInt(childSafeMultisigOwners.length)) {
    console.error(
      "CHILD_SAFE_MULTISIG_THRESHOLD cannot be greater than the number of CHILD_SAFE_MULTISIG_OWNERS!"
    );
    process.exit(1);
  }
};

const checkEnsName = async (
  publicClient: PublicClient,
  ensName: string,
  ensNameWrapperAddress: Address,
  parentSafeAddress: Address
) => {
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

const getFundingTokens = async (
  publicClient: PublicClient,
  parentSafeAddress: Address,
  fundingAddresses: Address[],
  fundingAmounts: string[]
) => {
  if (fundingAmounts.length !== fundingAddresses.length) {
    console.error(
      "Funding addresses and funding amounts environment variables are different lengths!"
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

const getProposalDescription = (proposalDescriptionFile: string) => {
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

export const getValidatedConfig = async () => {
  const configRaw = getConfigRaw();

  const publicClient = getPublicClient(configRaw.chain);

  checkMultisigThreshold(
    configRaw.childSafeMultisigThreshold,
    configRaw.childSafeMultisigOwners
  );

  await checkEnsName(
    publicClient,
    configRaw.ensName,
    configRaw.ensNameWrapperAddress,
    configRaw.parentSafeAddress
  );

  const fundingTokens = await getFundingTokens(
    publicClient,
    configRaw.parentSafeAddress,
    configRaw.fundingTokensAddresses,
    configRaw.fundingTokensAmounts
  );

  const proposalDescription = getProposalDescription(
    configRaw.proposalDescriptionFile
  );

  const config = {
    nonce: configRaw.nonce,
    publicClient,
    network: {
      chain: configRaw.chain,
    },
    parentSafe: {
      parentSafeAddress: configRaw.parentSafeAddress,
      fundingTokens,
    },
    childSafe: {
      childSafeName: configRaw.childSafeName,
      childSafeMultisigOwners: configRaw.childSafeMultisigOwners,
      childSafeMultisigThreshold: configRaw.childSafeMultisigThreshold,
    },
    contractAddresses: {
      ens: {
        ensNameWrapperAddress: configRaw.ensNameWrapperAddress,
        ensPublicResolverAddress: configRaw.ensPublicResolverAddress,
      },
      fractal: {
        fractalRegistryAddress: configRaw.fractalRegistryAddress,
      },
      safe: {
        multiSendCallOnlyAddress: configRaw.multiSendCallOnlyAddress,
        gnosisSafeL2SingletonAddress: configRaw.gnosisSafeL2SingletonAddress,
        gnosisSafeProxyFactoryAddress: configRaw.gnosisSafeProxyFactoryAddress,
        compatibilityFallbackHandlerAddress:
          configRaw.compatibilityFallbackHandlerAddress,
      },
      zodiac: {
        moduleProxyFactoryAddress: configRaw.moduleProxyFactoryAddress,
        fractalModuleMasterCopyAddress:
          configRaw.fractalModuleMasterCopyAddress,
        realityModuleMasterCopyAddress:
          configRaw.realityModuleMasterCopyAddress,
      },
    },
    ensData: {
      ensName: configRaw.ensName,
      ensIpfsHash: configRaw.ensIpfsHash,
    },
    proposalData: {
      proposalTitle: configRaw.proposalTitle,
      proposalDescription,
      proposalDocumentationUrl: configRaw.proposalDocumentationUrl,
    },
    realityData: {
      realityOracle: configRaw.realityOracleAddress,
      realityTemplateId: configRaw.realityTemplateId,
      realityMinimumBond: configRaw.realityMinimumBond,
      realityQuestionTimeout: configRaw.realityQuestionTimeout,
      realityQuestionCooldown: configRaw.realityQuestionCooldown,
      realityQuestionArbitrator: configRaw.realityArbitratorAddress,
      realityAnswerExpiration: configRaw.realityAnswerExpiration,
    },
  };

  console.log("User provided environment variables:");
  console.table([
    { property: "Chain", value: config.network.chain.name },
    {
      property: "Parent Safe address",
      value: config.parentSafe.parentSafeAddress,
    },
    { property: "ENS name", value: config.ensData.ensName },
    { property: "ENS IPFS hash", value: config.ensData.ensIpfsHash },
    { property: "Proposal title", value: config.proposalData.proposalTitle },
    {
      property: "Proposal description",
      value: `${config.proposalData.proposalDescription.substring(0, 50)}...`,
    },
    {
      property: "Proposal documentation URL",
      value: config.proposalData.proposalDocumentationUrl,
    },
    {
      property: "Child Safe name",
      value: config.childSafe.childSafeName,
    },
    ...config.childSafe.childSafeMultisigOwners.map((owner, i) => ({
      property: `Child Safe multisig owner #${i + 1}`,
      value: owner,
    })),
    {
      property: "Child Safe multisig threshold",
      value: config.childSafe.childSafeMultisigThreshold.toString(),
    },
    ...config.parentSafe.fundingTokens.map((token, i) => ({
      property: `Funding address #${i + 1}`,
      value: token.address,
    })),
    ...config.parentSafe.fundingTokens.map((token, i) => ({
      property: `Funding amount (full units) #${i + 1}`,
      value: token.amount.toString(),
    })),
    {
      property: "Reality template ID",
      value: config.realityData.realityTemplateId.toString(),
    },
    {
      property: "Reality minimum bond (full units)",
      value: config.realityData.realityMinimumBond.toString(),
    },
    {
      property: "Reality question timeout (seconds)",
      value: config.realityData.realityQuestionCooldown,
    },
    {
      property: "Reality question cooldown (seconds)",
      value: config.realityData.realityQuestionCooldown,
    },
    {
      property: "Reality answer expiration (seconds)",
      value: config.realityData.realityAnswerExpiration,
    },
  ]);
  console.log("");

  console.log(
    `Network specific (${config.network.chain.name}) contract addresses:`
  );
  console.table([
    {
      property: "ENS Name Wrapper address",
      value: config.contractAddresses.ens.ensNameWrapperAddress,
    },
    {
      property: "ENS Public Resolver address",
      value: config.contractAddresses.ens.ensPublicResolverAddress,
    },
    {
      property: "FractalModule Master Copy address",
      value: config.contractAddresses.zodiac.fractalModuleMasterCopyAddress,
    },
    {
      property: "FractalRegistry address",
      value: config.contractAddresses.fractal.fractalRegistryAddress,
    },
    {
      property: "MultiSendCallOnly address",
      value: config.contractAddresses.safe.multiSendCallOnlyAddress,
    },
    {
      property: "ModuleProxyFactory address",
      value: config.contractAddresses.zodiac.moduleProxyFactoryAddress,
    },
    {
      property: "GnosisSafeL2 Singleton address",
      value: config.contractAddresses.safe.gnosisSafeL2SingletonAddress,
    },
    {
      property: "GnosisSafeProxyFactory address",
      value: config.contractAddresses.safe.gnosisSafeProxyFactoryAddress,
    },
    {
      property: "CompatibilityFallbackHandler address",
      value: config.contractAddresses.safe.compatibilityFallbackHandlerAddress,
    },
    {
      property: "RealityModule Master Copy address",
      value: config.contractAddresses.zodiac.realityModuleMasterCopyAddress,
    },
    {
      property: "Reality Oracle address",
      value: config.realityData.realityOracle,
    },
    {
      property: "Reality DAO Arbitrator address",
      value: config.realityData.realityQuestionArbitrator,
    },
  ]);
  console.log("");

  return config;
};
