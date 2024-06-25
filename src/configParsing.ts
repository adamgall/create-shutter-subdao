import "dotenv/config";
import { Chain, getAddress, parseEther } from "viem";
import { sepolia, mainnet } from "viem/chains";

enum SingletonAddressNames {
  EnsNameWrapper,
  EnsPublicResolver,
  GnosisSafeProxyFactory,
  GnosisSafeL2Singleton,
  ModuleProxyFactory,
  FractalModuleMasterCopy,
  MultiSendCallOnly,
  CompatibilityFallbackHandler,
  FractalRegistry,
  RealityModuleMasterCopy,
  RealityOracle,
  RealityArbitrator,
}

const getSingletonAddress = (chain: Chain, name: SingletonAddressNames) => {
  switch (chain) {
    case mainnet: {
      switch (name) {
        case SingletonAddressNames.EnsNameWrapper: {
          return getAddress("0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401");
        }
        case SingletonAddressNames.EnsPublicResolver: {
          return getAddress("0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63");
        }
        case SingletonAddressNames.GnosisSafeProxyFactory: {
          return getAddress("0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2");
        }
        case SingletonAddressNames.GnosisSafeL2Singleton: {
          return getAddress("0x3E5c63644E683549055b9Be8653de26E0B4CD36E");
        }
        case SingletonAddressNames.ModuleProxyFactory: {
          return getAddress("0x000000000000aDdB49795b0f9bA5BC298cDda236");
        }
        case SingletonAddressNames.FractalModuleMasterCopy: {
          return getAddress("0x87326A981fc56823e26599Ff4D0A4eceAFfF3be0");
        }
        case SingletonAddressNames.MultiSendCallOnly: {
          return getAddress("0x40A2aCCbd92BCA938b02010E17A5b8929b49130D");
        }
        case SingletonAddressNames.CompatibilityFallbackHandler: {
          return getAddress("0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4");
        }
        case SingletonAddressNames.FractalRegistry: {
          return getAddress("0x023BDAEFeDDDdd5B43aF125CAA8007a99A886Fd3");
        }
        case SingletonAddressNames.RealityModuleMasterCopy: {
          return getAddress("0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0");
        }
        case SingletonAddressNames.RealityOracle: {
          return getAddress("0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c");
        }
        case SingletonAddressNames.RealityArbitrator: {
          return getAddress("0xf72cfd1b34a91a64f9a98537fe63fbab7530adca");
        }
        default: {
          console.error(`Address ${name} not set!`);
          process.exit(1);
        }
      }
      break;
    }
    case sepolia: {
      switch (name) {
        case SingletonAddressNames.EnsNameWrapper: {
          return getAddress("0x0635513f179D50A207757E05759CbD106d7dFcE8");
        }
        case SingletonAddressNames.EnsPublicResolver: {
          return getAddress("0x8FADE66B79cC9f707aB26799354482EB93a5B7dD");
        }
        case SingletonAddressNames.GnosisSafeProxyFactory: {
          return getAddress("0xc22834581ebc8527d974f8a1c97e1bea4ef910bc");
        }
        case SingletonAddressNames.GnosisSafeL2Singleton: {
          return getAddress("0xfb1bffc9d739b8d520daf37df666da4c687191ea");
        }
        case SingletonAddressNames.ModuleProxyFactory: {
          return getAddress("0x000000000000aDdB49795b0f9bA5BC298cDda236");
        }
        case SingletonAddressNames.FractalModuleMasterCopy: {
          return getAddress("0x1b26345a4a41d9f588e1b161b6e8f21d27547184");
        }
        case SingletonAddressNames.MultiSendCallOnly: {
          return getAddress("0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B");
        }
        case SingletonAddressNames.CompatibilityFallbackHandler: {
          return getAddress("0x017062a1dE2FE6b99BE3d9d37841FeD19F573804");
        }
        case SingletonAddressNames.FractalRegistry: {
          return getAddress("0x4791FF2a6E84F012402c0679C12Cb1d9260450A6");
        }
        case SingletonAddressNames.RealityModuleMasterCopy: {
          return getAddress("0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0");
        }
        case SingletonAddressNames.RealityOracle: {
          return getAddress("0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA");
        }
        case SingletonAddressNames.RealityArbitrator: {
          return getAddress("0x05b942faecfb3924970e3a28e0f230910cedff45");
        }
        default: {
          console.error(`Address ${name} not set!`);
          process.exit(1);
        }
      }
      break;
    }
    default: {
      console.error(`Chain ${chain.name} not supported!`);
      process.exit(1);
    }
  }
};

const getEnvVar = (name: string) => {
  const envVar = process.env[name];

  if (envVar === undefined) {
    console.error(`${name} environment variable is missing!`);
    process.exit(1);
  }

  return envVar.trim();
};

const getChain = (name: string) => {
  const envVar = getEnvVar(name);

  const value =
    envVar === "mainnet" ? mainnet : envVar === "sepolia" ? sepolia : undefined;

  if (value === undefined) {
    console.error(`${name} environment variable is malformed!`);
    process.exit(1);
  }

  return value;
};

const getStringEnvVar = (name: string) => {
  const envVar = getEnvVar(name);

  return envVar;
};

const getStringsEnvVar = (name: string) => {
  const envVar = getEnvVar(name);

  const items = envVar.split(",").map((item) => item.trim());

  if (items.length === 0) {
    console.error(
      `${name} environment variable is malformed, no values present!`
    );
    process.exit(1);
  }

  return items;
};

const getAddressEnvVar = (name: string) => {
  const envVar = getEnvVar(name);

  let value;

  try {
    value = getAddress(envVar);
  } catch {
    console.error(`${name} environment variable isn't a valid address!`);
    process.exit(1);
  }

  return value;
};

const getAddressesEnvVar = (name: string) => {
  const envVar = getEnvVar(name);

  const items = envVar.split(",").map((item) => {
    let value;

    try {
      value = getAddress(item.trim());
    } catch {
      console.error(`${name} environment variable isn't a valid address!`);
      process.exit(1);
    }

    return value;
  });

  if (items.length === 0) {
    console.error(
      `${name} environment variable is malformed, no addresses present!`
    );
    process.exit(1);
  }

  return items;
};

const getBigIntEnvVar = (name: string) => {
  const envVar = getEnvVar(name);

  let value;

  try {
    value = BigInt(envVar);
  } catch {
    console.error(`${name} is not a valid bigint!`);
    process.exit(1);
  }

  return value;
};

const getIntegerEnvVar = (name: string) => {
  const envVar = getEnvVar(name);

  let value;

  try {
    value = parseInt(envVar);
  } catch {
    console.error(`${name} environment variable is not a valid number!`);
    process.exit(1);
  }

  return value;
};

const getEtherEnvVar = (name: string) => {
  const envVar = getEnvVar(name);

  let value;

  try {
    value = parseEther(envVar);
  } catch {
    console.error(`${name} environment variable is not a valid number!`);
    process.exit(1);
  }

  return value;
};

export const getConfigRaw = () => {
  const chain = getChain("CHAIN");

  const parentSafeAddress = getAddressEnvVar("PARENT_SAFE_ADDRESS");
  const proposalTitle = getStringEnvVar("PROPOSAL_TITLE");
  const proposalDescriptionFile = getStringEnvVar("PROPOSAL_DESCRIPTION_FILE");
  const proposalDocumentationUrl = getStringEnvVar(
    "PROPOSAL_DOCUMENTATION_URL"
  );
  const ensName = getStringEnvVar("ENS_NAME");
  const ensIpfsHash = getStringEnvVar("ENS_IPFS_HASH");
  const childSafeName = getStringEnvVar("CHILD_SAFE_NAME");
  const childSafeMultisigOwners = getAddressesEnvVar(
    "CHILD_SAFE_MULTISIG_OWNERS"
  );
  const childSafeMultisigThreshold = getBigIntEnvVar(
    "CHILD_SAFE_MULTISIG_THRESHOLD"
  );
  const fundingTokensAddresses = getAddressesEnvVar("FUNDING_ERC20_ADDRESSES");
  const fundingTokensAmounts = getStringsEnvVar("FUNDING_ERC20_AMOUNTS");
  const realityTemplateId = getBigIntEnvVar("REALITY_TEMPLATE_ID");
  const realityMinimumBond = getEtherEnvVar("REALITY_MINIMUM_BOND");
  const realityQuestionTimeout = getIntegerEnvVar("REALITY_QUESTION_TIMEOUT");
  const realityQuestionCooldown = getIntegerEnvVar("REALITY_QUESTION_COOLDOWN");
  const realityAnswerExpiration = getIntegerEnvVar("REALITY_ANSWER_EXPIRATION");

  const ensNameWrapperAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.EnsNameWrapper
  );
  const ensPublicResolverAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.EnsPublicResolver
  );
  const gnosisSafeProxyFactoryAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.GnosisSafeProxyFactory
  );
  const gnosisSafeL2SingletonAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.GnosisSafeL2Singleton
  );
  const moduleProxyFactoryAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.ModuleProxyFactory
  );
  const fractalModuleMasterCopyAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.FractalModuleMasterCopy
  );
  const multiSendCallOnlyAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.MultiSendCallOnly
  );
  const compatibilityFallbackHandlerAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.CompatibilityFallbackHandler
  );
  const fractalRegistryAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.FractalRegistry
  );
  const realityModuleMasterCopyAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.RealityModuleMasterCopy
  );
  const realityOracleAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.RealityOracle
  );
  const realityArbitratorAddress = getSingletonAddress(
    chain,
    SingletonAddressNames.RealityArbitrator
  );

  return {
    chain,
    parentSafeAddress,
    fundingTokensAddresses,
    fundingTokensAmounts,
    childSafeName,
    childSafeMultisigOwners,
    childSafeMultisigThreshold,
    ensName,
    ensIpfsHash,
    proposalTitle,
    proposalDescriptionFile,
    proposalDocumentationUrl,
    realityTemplateId,
    realityMinimumBond,
    realityQuestionTimeout,
    realityQuestionCooldown,
    realityAnswerExpiration,
    ensNameWrapperAddress,
    ensPublicResolverAddress,
    fractalRegistryAddress,
    multiSendCallOnlyAddress,
    gnosisSafeL2SingletonAddress,
    gnosisSafeProxyFactoryAddress,
    compatibilityFallbackHandlerAddress,
    moduleProxyFactoryAddress,
    fractalModuleMasterCopyAddress,
    realityModuleMasterCopyAddress,
    realityOracleAddress,
    realityArbitratorAddress,
  };
};
