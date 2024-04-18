import * as readline from "readline/promises";
import {
  azoriusContractWriteable,
  gnosisSafeProxyFactoryContract,
  safeContract,
} from "./contracts";
import { findAzoriusModule, getAllModulesOnSafe } from "./modules";
import { getConfig } from "./config";
import { getPublicClient, getWalletClient } from "./clients";
import { ensOwner } from "./ens";
import { findVotingStrategy, getAllStrategiesOnAzorius } from "./strategies";
import {
  createDeclareSubDaoTransaction,
  createDeployFractalModuleTransaction,
  createDeploySafeTransaction,
  createEnableModuleTransaction,
  createEnsTransaction,
  createMultiSendTransaction,
  createRemoveOwnerTransaction,
  createSafeExecTransaction,
  createUpdateDaoNameTransaction,
  generateSaltNonce,
  getFractalModuleInitializer,
  getGnosisSafeInitializer,
  getPredictedFractalModuleAddress,
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

  const config = getConfig();
  const publicClient = getPublicClient(config.network.chain);

  const parentSafe = safeContract(
    config.contractAddresses.user.parentSafeAddress,
    publicClient
  );

  const ensOwnerAddress = await ensOwner(
    config.ensData.ensName,
    config.contractAddresses.ens.ensNameWrapperAddress,
    publicClient
  );
  if (config.contractAddresses.user.parentSafeAddress !== ensOwnerAddress) {
    console.error("ENS name not owned by parent Safe address!");
    process.exit(1);
  }
  console.log(
    `ENS name ${config.ensData.ensName} confirmed to be owned by parent Safe address ${config.contractAddresses.user.parentSafeAddress}.`
  );
  console.log("");

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

  const predictedSafeAddress = await getPredictedSafeAddress(
    gnosisSafeProxyFactoryContract(
      config.contractAddresses.safe.gnosisSafeProxyFactoryAddress,
      publicClient
    ),
    config.contractAddresses.safe.gnosisSafeL2SingletonAddress,
    salt(gnosisSafeInitializer, saltNonce)
  );

  const fractalModuleInitializer = getFractalModuleInitializer(
    config.contractAddresses.user.parentSafeAddress,
    predictedSafeAddress
  );

  const predictedFractalModuleAddress = getPredictedFractalModuleAddress(
    config.contractAddresses.fractal.fractalModuleMasterCopyAddress,
    config.contractAddresses.safe.moduleProxyFactoryAddress,
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

  const enableModuleTransaction = createEnableModuleTransaction(
    predictedSafeAddress,
    predictedFractalModuleAddress
  );

  console.log(
    `Enable Fractal module call, for use in nested MultiSend:\n${JSON.stringify(
      enableModuleTransaction,
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
    enableModuleTransaction,
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
    `Deploy new Safe call, for use in outer MultiSend:\n${JSON.stringify(
      deploySafeTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const deployFractalModuleTransaction = createDeployFractalModuleTransaction(
    config.contractAddresses.safe.moduleProxyFactoryAddress,
    config.contractAddresses.fractal.fractalModuleMasterCopyAddress,
    fractalModuleInitializer,
    saltNonce
  );

  console.log(
    `Deploy Fractal Module call, for use in outer MultiSend:\n${JSON.stringify(
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
    `Safe execTransaction call, for use in outer MultiSend:\n${JSON.stringify(
      safeExecTransaction,
      null,
      "\t"
    )}`
  );
  console.log("");

  const multiSendTransaction = createMultiSendTransaction(
    config.contractAddresses.safe.multiSendCallOnlyAddress,
    [deploySafeTransaction, deployFractalModuleTransaction, safeExecTransaction]
  );

  console.log(
    `Outer MultiSend transaction:\n${JSON.stringify(
      multiSendTransaction,
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

  const submitProposalArgs = [
    linearVotingStrategy.address,
    "0x",
    [ensTransaction, multiSendTransaction, declareSubDaoTransaction],
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

  if (config.dryRun === true) {
    console.log("This is a DRY RUN, not making any transactions.");
    process.exit(0);
  }

  const answer = await rl.question(
    "If the above looks correct, type 'continue' to submit the transaction. Otherwise, enter anything else to quit.\n"
  );

  if (answer !== "continue") {
    process.exit(0);
  }
  console.log("");

  const azoriusModuleWriteable = azoriusContractWriteable(
    azoriusModule.address,
    getWalletClient(config.network.signingKey, config.network.chain)
  );

  console.log("Submitting transaction...");

  const proposalHash = await azoriusModuleWriteable.simulate.submitProposal(
    submitProposalArgs
  );

  console.log(`Proposal created at transaction ${proposalHash}`);
  process.exit(0);
})();
