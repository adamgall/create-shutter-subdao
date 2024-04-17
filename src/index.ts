import { azoriusContractWriteable, safeContract } from "./contracts";
import { findAzoriusModule, getAllModulesOnSafe } from "./modules";
import { getConfig } from "./config";
import { getPublicClient, getWalletClient } from "./clients";
import { ensOwner } from "./ens";
import { createEnsTransaction } from "./ensTx";
import { findVotingStrategy, getAllStrategiesOnAzorius } from "./strategies";

(async () => {
  const config = getConfig();
  const publicClient = getPublicClient(config.network.chain);

  console.log(`Using chain: ${config.network.chain.name}.`);

  const parentSafe = safeContract(
    config.contractAddresses.user.parentSafeAddress,
    publicClient
  );
  console.log(
    `Using parent Safe address: ${config.contractAddresses.user.parentSafeAddress}.`
  );

  console.log(`Using ENS name: ${config.ensData.ensName}.`);
  console.log("");

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

  if (config.dryRun === true) {
    console.log("This is a DRY_RUN, not making any transactions.");
    process.exit(0);
  }

  const walletClient = getWalletClient(
    config.network.signingKey,
    config.network.chain
  );
  const azoriusModuleWriteable = azoriusContractWriteable(
    azoriusModule.address,
    walletClient
  );

  console.log("Submitting proposal...");
  const proposal = await azoriusModuleWriteable.write.submitProposal([
    linearVotingStrategy.address,
    "0x",
    [
      createEnsTransaction(
        config.contractAddresses.ens.ensPublicResolverAddress,
        config.ensData.ensName,
        config.ensData.ensIpfsHash
      ),
    ],
    `{"title":"${config.proposalData.proposalTitle}","description":${config.proposalData.proposalDescription},"documentationUrl":"${config.proposalData.proposalDocumentationUrl}"}`,
  ]);
  console.log(`Proposal submitted at ${proposal}`);
})();
