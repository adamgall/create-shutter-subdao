import { safeContract } from "./contracts";
import { findAzoriusModule, getAllModulesOnSafe } from "./modules";
import { getConfig } from "./config";
import { getWalletClient } from "./clients";
import { ensOwner } from "./ens";
import { findVotingStrategy, getAllStrategiesOnAzorius } from "./strategies";

(async () => {
  const config = getConfig();
  const walletClient = getWalletClient(config.signingKey, config.chain);

  const parentSafe = safeContract(config.parentSafeAddress, walletClient);
  console.log(
    `Using parent Safe address: ${config.parentSafeAddress} on ${config.chain.name}.`
  );

  console.log(`Using ENS name: ${config.ensName}.`);

  const ensOwnerAddress = await ensOwner(
    config.ensName,
    config.ensNameWrapperAddress,
    walletClient
  );
  if (config.parentSafeAddress !== ensOwnerAddress) {
    console.error("ENS name not owned by parent Safe address!");
    process.exit(1);
  }
  console.log(
    `ENS name ${config.ensName} confirmed to be owned by parent Safe address ${config.parentSafeAddress}.`
  );

  const allModuleAddresses = await getAllModulesOnSafe(parentSafe);
  console.log(`All modules on Safe: ${allModuleAddresses.join(", ")}.`);

  const azoriusModule = await findAzoriusModule(
    walletClient,
    allModuleAddresses
  );

  if (azoriusModule === undefined) {
    console.error(
      "No Azorius module found on this Safe, so can't create any proposals!"
    );
    process.exit(1);
  }

  console.log(`Found Azorius module at: ${azoriusModule.address}.`);

  const allAzoriusStrategyAddresses = await getAllStrategiesOnAzorius(
    azoriusModule
  );
  console.log(
    `All strategies on Azorius: ${allAzoriusStrategyAddresses.join(", ")}.`
  );

  const linearVotingStrategy = await findVotingStrategy(
    walletClient,
    allAzoriusStrategyAddresses
  );

  if (linearVotingStrategy === undefined) {
    console.error(
      "No voting strategy found on this Azorius module, so can't create any proposals!"
    );
    process.exit(1);
  }

  console.log(`Found voting strategy at: ${linearVotingStrategy.address}.`);
})();
