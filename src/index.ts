import { gnosisSafeProxyFactoryContract, safeContract } from "./contracts";
import { findAzoriusModule, getAllModulesOnSafe } from "./modules";
import { findVotingStrategy, getAllStrategiesOnAzorius } from "./strategies";
import {
  createDeclareSubDaoTransaction,
  createDeployModuleTransaction,
  createDeploySafeTransaction,
  createEnableModuleTransaction,
  createEnsTransaction,
  createMultiSendTransaction,
  createRemoveOwnerTransaction,
  createSafeExecTransaction,
  createTransferTokensTransactions,
  createUpdateDaoNameTransaction,
  generateSaltNonce,
  getFractalModuleInitializer,
  getGnosisSafeInitializer,
  getPredictedModuleAddress,
  getPredictedSafeAddress,
  getRealityModuleInitializer,
  multiSendFunctionData,
  salt,
} from "./transactions";
import { getValidatedConfig } from "./configValidation";

(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  const config = await getValidatedConfig();
  const publicClient = config.publicClient;

  const parentSafe = safeContract(
    config.parentSafe.parentSafeAddress,
    publicClient
  );

  const allModuleAddresses = await getAllModulesOnSafe(parentSafe);
  console.log(`All modules on Safe: ${allModuleAddresses.join(", ")}.`);

  const azoriusModule = await findAzoriusModule(
    publicClient,
    allModuleAddresses
  );

  if (azoriusModule === undefined) {
    console.error(
      "No Azorius module found on this Safe, so can't create any proposals!"
    );
    process.exit(1);
  }

  console.log(`Found Azorius module at: ${azoriusModule.address}.`);
  console.log("");

  const allAzoriusStrategyAddresses = await getAllStrategiesOnAzorius(
    azoriusModule
  );
  console.log(
    `All voting strategies on Azorius: ${allAzoriusStrategyAddresses.join(
      ", "
    )}.`
  );

  const linearVotingStrategy = await findVotingStrategy(
    publicClient,
    allAzoriusStrategyAddresses
  );

  if (linearVotingStrategy === undefined) {
    console.error(
      "No linear voting strategy found on this Azorius module, so can't create any proposals!"
    );
    process.exit(1);
  }

  console.log(
    `Found linear voting strategy at: ${linearVotingStrategy.address}.`
  );
  console.log("");

  const saltNonce = config.nonce || generateSaltNonce();

  console.log(
    `Using salt nonce ${saltNonce} for all create2 contract generation and address prediction.`
  );
  console.log("");

  const gnosisSafeInitializer = getGnosisSafeInitializer(
    config.childSafe.childSafeMultisigOwners,
    config.contractAddresses.safe.multiSendCallOnlyAddress,
    config.contractAddresses.safe.compatibilityFallbackHandlerAddress
  );

  const predictedChildSafeAddress = getPredictedSafeAddress(
    await gnosisSafeProxyFactoryContract(
      config.contractAddresses.safe.gnosisSafeProxyFactoryAddress,
      config.publicClient
    ).read.proxyCreationCode(),
    config.contractAddresses.safe.gnosisSafeProxyFactoryAddress,
    config.contractAddresses.safe.gnosisSafeL2SingletonAddress,
    salt(gnosisSafeInitializer, saltNonce)
  );

  const fractalModuleInitializer = getFractalModuleInitializer(
    config.parentSafe.parentSafeAddress,
    predictedChildSafeAddress
  );

  const predictedFractalModuleAddress = getPredictedModuleAddress(
    config.contractAddresses.zodiac.fractalModuleMasterCopyAddress,
    config.contractAddresses.zodiac.moduleProxyFactoryAddress,
    fractalModuleInitializer,
    saltNonce
  );

  const realityModuleInitializer = getRealityModuleInitializer(
    predictedChildSafeAddress,
    predictedChildSafeAddress,
    config.realityData
  );

  const predictedRealityModuleAddress = getPredictedModuleAddress(
    config.contractAddresses.zodiac.realityModuleMasterCopyAddress,
    config.contractAddresses.zodiac.moduleProxyFactoryAddress,
    realityModuleInitializer,
    saltNonce
  );

  console.log(`Child Safe initialization bytecode: ${gnosisSafeInitializer}`);
  console.log("");
  console.log(
    `Fractal Module initilization bytecode: ${fractalModuleInitializer}`
  );
  console.log("");
  console.log(
    `Reality Module initilization bytecode: ${realityModuleInitializer}`
  );
  console.log("");
  console.log(`Predicted Child Safe address: ${predictedChildSafeAddress}`);
  console.log(
    `Predicted Fractal Module address: ${predictedFractalModuleAddress}`
  );
  console.log(
    `Predicted Reality Module address: ${predictedRealityModuleAddress}`
  );
  console.log("");

  const ensTransaction = createEnsTransaction(
    config.contractAddresses.ens.ensPublicResolverAddress,
    config.ensData.ensName,
    config.ensData.ensIpfsHash
  );

  console.log(
    `ENS setText transaction:\n${JSON.stringify(ensTransaction, null, "\t")}`
  );
  console.log("");

  const enableFractalModuleTransaction = createEnableModuleTransaction(
    predictedChildSafeAddress,
    predictedFractalModuleAddress
  );

  console.log(
    `Enable Fractal module call, for use in nested MultiSend:\n${JSON.stringify(
      enableFractalModuleTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const enableRealityModuleTransaction = createEnableModuleTransaction(
    predictedChildSafeAddress,
    predictedRealityModuleAddress
  );

  console.log(
    `Enable Reality module call, for use in nested MultiSend:\n${JSON.stringify(
      enableRealityModuleTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const removeOwnerTransaction = createRemoveOwnerTransaction(
    predictedChildSafeAddress,
    config.contractAddresses.safe.multiSendCallOnlyAddress,
    config.childSafe.childSafeMultisigOwners,
    config.childSafe.childSafeMultisigThreshold
  );

  console.log(
    `Remove MultiSend owner call, for use in nested MultiSend:\n${JSON.stringify(
      removeOwnerTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const updateDaoNameTransaction = createUpdateDaoNameTransaction(
    config.contractAddresses.fractal.fractalRegistryAddress,
    config.childSafe.childSafeName
  );

  console.log(
    `Update DAO Name call, for use in nested MultiSend:\n${JSON.stringify(
      updateDaoNameTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const multiSendFunctionDataBytes = multiSendFunctionData([
    enableFractalModuleTransaction,
    enableRealityModuleTransaction,
    removeOwnerTransaction,
    updateDaoNameTransaction,
  ]);

  console.log(
    `Nested MultiSend transaction bytes:\n${JSON.stringify(
      multiSendFunctionDataBytes,
      null,
      "\t"
    )}`
  );
  console.log("");

  const deploySafeTransaction = createDeploySafeTransaction(
    config.contractAddresses.safe.gnosisSafeProxyFactoryAddress,
    config.contractAddresses.safe.gnosisSafeL2SingletonAddress,
    gnosisSafeInitializer,
    saltNonce
  );

  console.log(
    `Deploy new Safe call, for use in first MultiSend:\n${JSON.stringify(
      deploySafeTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const deployFractalModuleTransaction = createDeployModuleTransaction(
    config.contractAddresses.zodiac.moduleProxyFactoryAddress,
    config.contractAddresses.zodiac.fractalModuleMasterCopyAddress,
    fractalModuleInitializer,
    saltNonce
  );

  console.log(
    `Deploy Fractal Module call, for use in first MultiSend:\n${JSON.stringify(
      deployFractalModuleTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const deployRealityModuleTransaction = createDeployModuleTransaction(
    config.contractAddresses.zodiac.moduleProxyFactoryAddress,
    config.contractAddresses.zodiac.realityModuleMasterCopyAddress,
    realityModuleInitializer,
    saltNonce
  );

  console.log(
    `Deploy Reality Module call, for use in first MultiSend:\n${JSON.stringify(
      deployRealityModuleTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const safeExecTransaction = createSafeExecTransaction(
    predictedChildSafeAddress,
    config.contractAddresses.safe.multiSendCallOnlyAddress,
    multiSendFunctionDataBytes
  );

  console.log(
    `Safe execTransaction call, for use in first MultiSend:\n${JSON.stringify(
      safeExecTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const firstMultiSendTransaction = createMultiSendTransaction(
    config.contractAddresses.safe.multiSendCallOnlyAddress,
    false,
    [
      deploySafeTransaction,
      deployFractalModuleTransaction,
      deployRealityModuleTransaction,
      safeExecTransaction,
    ]
  );

  console.log(
    `First MultiSend transaction:\n${JSON.stringify(
      firstMultiSendTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const declareSubDaoTransaction = createDeclareSubDaoTransaction(
    config.contractAddresses.fractal.fractalRegistryAddress,
    predictedChildSafeAddress
  );

  console.log(
    `Declaring child DAO transaction:\n${JSON.stringify(
      declareSubDaoTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const transferTokensTransactions = createTransferTokensTransactions(
    config.parentSafe.fundingTokens,
    predictedChildSafeAddress
  );

  console.log(
    `Transfer tokens transactions in second MultiSend:\n${JSON.stringify(
      transferTokensTransactions,
      null,
      "\t"
    )}`
  );
  console.log("");

  const secondMultiSendTransaction = createMultiSendTransaction(
    config.contractAddresses.safe.multiSendCallOnlyAddress,
    true,
    transferTokensTransactions
  );

  console.log(
    `Second MultiSend transaction:\n${JSON.stringify(
      secondMultiSendTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const submitProposalArgs = [
    linearVotingStrategy.address,
    "0x",
    [
      ensTransaction,
      firstMultiSendTransaction,
      declareSubDaoTransaction,
      secondMultiSendTransaction,
    ],
    `{"title":"${config.proposalData.proposalTitle}","description":${config.proposalData.proposalDescription},"documentationUrl":"${config.proposalData.proposalDocumentationUrl}"}`,
  ] as const;

  console.log("!!! PROPOSAL ARGUMENTS !!!");
  console.log(submitProposalArgs);
})();
