import { azoriusContractWriteable, safeContract } from "./contracts";
import { findAzoriusModule, getAllModulesOnSafe } from "./modules";
import { getConfig } from "./config";
import { getPublicClient, getWalletClient } from "./clients";
import { ensOwner } from "./ens";
import { createEnsTransaction } from "./ensTx";
import { findVotingStrategy, getAllStrategiesOnAzorius } from "./strategies";
import { simulate } from "./simulate";

(async () => {
  const config = getConfig();
  const publicClient = getPublicClient(config.chain);

  console.log(`Using chain: ${config.chain.name}.`);

  // const parentSafe = safeContract(config.parentSafeAddress, publicClient);
  // console.log(`Using parent Safe address: ${config.parentSafeAddress}.`);

  // console.log(`Using ENS name: ${config.ensName}.`);
  // console.log("");

  // const ensOwnerAddress = await ensOwner(
  //   config.ensName,
  //   config.ensNameWrapperAddress,
  //   publicClient
  // );
  // if (config.parentSafeAddress !== ensOwnerAddress) {
  //   console.error("ENS name not owned by parent Safe address!");
  //   process.exit(1);
  // }
  // console.log(
  //   `ENS name ${config.ensName} confirmed to be owned by parent Safe address ${config.parentSafeAddress}.`
  // );
  // console.log("");

  // const allModuleAddresses = await getAllModulesOnSafe(parentSafe);
  // console.log(`All modules on Safe: ${allModuleAddresses.join(", ")}.`);

  // const azoriusModule = await findAzoriusModule(
  //   publicClient,
  //   allModuleAddresses
  // );

  // if (azoriusModule === undefined) {
  //   console.error(
  //     "No Azorius module found on this Safe, so can't create any proposals!"
  //   );
  //   process.exit(1);
  // }

  // console.log(`Found Azorius module at: ${azoriusModule.address}.`);
  // console.log("");

  // const allAzoriusStrategyAddresses = await getAllStrategiesOnAzorius(
  //   azoriusModule
  // );
  // console.log(
  //   `All voting strategies on Azorius: ${allAzoriusStrategyAddresses.join(
  //     ", "
  //   )}.`
  // );

  // const linearVotingStrategy = await findVotingStrategy(
  //   publicClient,
  //   allAzoriusStrategyAddresses
  // );

  // if (linearVotingStrategy === undefined) {
  //   console.error(
  //     "No linear voting strategy found on this Azorius module, so can't create any proposals!"
  //   );
  //   process.exit(1);
  // }

  // console.log(
  //   `Found linear voting strategy at: ${linearVotingStrategy.address}.`
  // );
  // console.log("");

  await simulate(publicClient);
  process.exit(0);

  // if (config.dryRun === true) {
  //   console.log("This is a DRY_RUN, not making any transactions.");
  //   process.exit(0);
  // }

  // const walletClient = getWalletClient(config.signingKey, config.chain);
  // const azoriusModuleWriteable = azoriusContractWriteable(
  //   azoriusModule.address,
  //   walletClient
  // );

  // console.log("Submitting proposal...");
  // const proposal = await azoriusModuleWriteable.write.submitProposal([
  //   linearVotingStrategy.address,
  //   "0x",
  //   [
  //     createEnsTransaction(
  //       config.ensPublicResolverAddress,
  //       config.ensName,
  //       config.ensIpfsHash
  //     ),
  //   ],
  //   `{"title":"${config.proposalTitle}","description":${config.proposalDescription},"documentationUrl":"${config.proposalDocumentationUrl}"}`,
  // ]);
  // console.log(`Proposal submitted at ${proposal}`);
})();
