import * as readline from "readline/promises";
import {
  azoriusContractWriteable,
  gnosisSafeProxyFactoryContract,
  safeContract,
} from "./contracts";
import { findAzoriusModule, getAllModulesOnSafe } from "./modules";
import { getConfig } from "./config";
import { getWalletClient } from "./clients";
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
  multiSendFunctionData,
  salt,
} from "./transactions";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  const config = await getConfig();
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

  const saltNonce = generateSaltNonce();

  console.log(
    `Using salt nonce ${saltNonce} for all create2 contract generation and address prediction.`
  );
  console.log("");

  const gnosisSafeInitializer = getGnosisSafeInitializer(
    config.childSafe.childSafeMultisigOwners,
    config.contractAddresses.safe.multiSendCallOnlyAddress,
    config.contractAddresses.safe.compatibilityFallbackHandlerAddress
  );

  const predictedSafeAddress = getPredictedSafeAddress(
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
    predictedSafeAddress
  );

  const predictedFractalModuleAddress = getPredictedModuleAddress(
    config.contractAddresses.zodiac.fractalModuleMasterCopyAddress,
    config.contractAddresses.zodiac.moduleProxyFactoryAddress,
    fractalModuleInitializer,
    saltNonce
  );

  console.log(`Child Safe initialization bytecode: ${gnosisSafeInitializer}`);
  console.log("");
  console.log(
    `Fractal Module initilization bytecode: ${fractalModuleInitializer}`
  );
  console.log("");
  console.log(`Predicted Child Safe address: ${predictedSafeAddress}`);
  console.log(
    `Predicted Fractal Module address: ${predictedFractalModuleAddress}`
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
    predictedSafeAddress,
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

  const removeOwnerTransaction = createRemoveOwnerTransaction(
    predictedSafeAddress,
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

  const safeExecTransaction = createSafeExecTransaction(
    predictedSafeAddress,
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
    [deploySafeTransaction, deployFractalModuleTransaction, safeExecTransaction]
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
    predictedSafeAddress
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
    predictedSafeAddress
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

  console.log(
    `Full proposal transaction arguments:\n${JSON.stringify(
      submitProposalArgs,
      null,
      "\t"
    )}`
  );
  console.log("");

  const azoriusModuleWriteable = azoriusContractWriteable(
    azoriusModule.address,
    getWalletClient(config.network.signingKey, config.network.chain)
  );

  if (config.dryRun === true) {
    const simulation = await azoriusModuleWriteable.simulate.submitProposal(
      submitProposalArgs
    );
    console.log(
      `This is a DRY RUN, not making any transactions. Simulating, instead:\n${JSON.stringify(
        simulation,
        null,
        "\t"
      )}`
    );
    process.exit(0);
  }

  const answer = await rl.question(
    "If the above looks correct, type 'continue' to submit the transaction. Otherwise, enter anything else to quit.\n"
  );

  if (answer !== "continue") {
    process.exit(0);
  }
  console.log("");

  console.log("Submitting transaction...");

  const proposalHash = await azoriusModuleWriteable.write.submitProposal(
    submitProposalArgs
  );

  console.log(`Proposal created at transaction ${proposalHash}`);
  process.exit(0);
})();
