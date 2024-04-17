import {
  Address,
  Hex,
  PublicClient,
  bytesToBigInt,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  getContractAddress,
  hexToBigInt,
  keccak256,
  parseAbiParameters,
} from "viem";
import {
  FractalModuleAbi,
  GnosisSafeL2Abi,
  GnosisSafeProxyFactoryAbi,
  ModuleProxyFactoryAbi,
} from "./abis";
import { randomBytes } from "crypto";

// https://github.com/safe-global/safe-deployments/tree/main/src/assets/v1.3.0

export const simulate = async (publicClient: PublicClient) => {
  console.log("");

  const gnosisSafeProxyFactoryAddress: Address =
    "0xc22834581ebc8527d974f8a1c97e1bea4ef910bc";
  const gnosisSafeL2SingletonAddress: Address =
    "0xfb1bffc9d739b8d520daf37df666da4c687191ea";
  const moduleProxyFactoryAddress: Address =
    "0xe93e4b198097c4cb3a6de594c90031cdac0b88f3";
  const fractalModuleMasterCopyAddress: Address =
    "0x1b26345a4a41d9f588e1b161b6e8f21d27547184";

  const gnosisSafeProxyFactory = getContract({
    address: gnosisSafeProxyFactoryAddress,
    abi: GnosisSafeProxyFactoryAbi,
    client: publicClient,
  });

  const moduleProxyFactory = getContract({
    address: moduleProxyFactoryAddress,
    abi: ModuleProxyFactoryAbi,
    client: publicClient,
  });

  const gnosisSafeInitializer = encodeFunctionData({
    abi: GnosisSafeL2Abi,
    functionName: "setup",
    args: [
      [
        "0xfcf7a2794D066110162ADdcE3085dfd6221D4ddD",
        "0xDB131c83b44A055750b49107031AA77B633148aB",
      ], // _owners
      2n, // _threshold
      "0x0000000000000000000000000000000000000000", // to - can we do all module setup by setting this to multisend?
      "0x0000000000000000000000000000000000000000000000000000000000000000", // data - same as above, pass data to multisend for all module setup
      "0x017062a1dE2FE6b99BE3d9d37841FeD19F573804", // fallbackHandler
      "0x0000000000000000000000000000000000000000", // paymentToken
      0n, // payment
      "0x0000000000000000000000000000000000000000", // paymentReceiver
    ],
  });

  const saltNonce = bytesToBigInt(randomBytes(32));
  const salt = (initializer: Hex) =>
    keccak256(
      encodePacked(["bytes", "uint256"], [keccak256(initializer), saltNonce])
    );

  const deploymentData = encodePacked(
    ["bytes", "uint256"],
    [
      await gnosisSafeProxyFactory.read.proxyCreationCode(),
      hexToBigInt(gnosisSafeL2SingletonAddress),
    ]
  );

  const predictedSafeAddress = getContractAddress({
    bytecode: deploymentData,
    from: gnosisSafeProxyFactoryAddress,
    opcode: "CREATE2",
    salt: salt(gnosisSafeInitializer),
  });
  console.log("predicted new safe address:", predictedSafeAddress);

  const { result: simulatedSafeAddress } =
    await gnosisSafeProxyFactory.simulate.createProxyWithNonce([
      gnosisSafeL2SingletonAddress,
      gnosisSafeInitializer,
      saltNonce,
    ]);
  console.log("simulated new safe address:", simulatedSafeAddress);

  console.log("");

  const fractalModuleInitializer = encodeFunctionData({
    abi: FractalModuleAbi,
    functionName: "setUp",
    args: [
      encodeAbiParameters(
        parseAbiParameters("address, address, address, address[]"),
        [
          predictedSafeAddress, // _owner // original parent safe // TODO update this
          predictedSafeAddress, // _avatar // new child safe
          predictedSafeAddress, // _target // new child safe
          [], // _controllers
        ]
      ),
    ],
  });

  const predictedFractalModuleAddress = getContractAddress({
    bytecode: `0x602d8060093d393df3363d3d373d3d3d363d73${fractalModuleMasterCopyAddress.slice(
      2
    )}5af43d82803e903d91602b57fd5bf3`,
    from: moduleProxyFactoryAddress,
    opcode: "CREATE2",
    salt: salt(fractalModuleInitializer),
  });
  console.log(
    "predicted new fractal module address:",
    predictedFractalModuleAddress
  );

  const { result: simulatedFractalModuleAddress } =
    await moduleProxyFactory.simulate.deployModule([
      fractalModuleMasterCopyAddress,
      fractalModuleInitializer,
      saltNonce,
    ]);
  console.log(
    "simulated new fractal module address:",
    simulatedFractalModuleAddress
  );

  console.log("");
};
