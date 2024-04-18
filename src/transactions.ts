import {
  Address,
  Chain,
  GetContractReturnType,
  Hex,
  HttpTransport,
  PublicClient,
  bytesToBigInt,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  hexToBigInt,
  keccak256,
  namehash,
  parseAbiParameters,
  toBytes,
  zeroAddress,
  zeroHash,
} from "viem";
import {
  FractalModuleAbi,
  GnosisSafeL2Abi,
  GnosisSafeProxyFactoryAbi,
  ModuleProxyFactoryAbi,
  MultiSendCallOnlyAbi,
} from "./abis";
import { randomBytes } from "crypto";
export const createEnsTransaction = (
  ensPublicResolverAddress: Address,
  ensName: string,
  ensIPFSHash: string
) => {
  return {
    operation: 0,
    to: ensPublicResolverAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: "node", type: "bytes32" },
            { name: "key", type: "string" },
            { name: "value", type: "string" },
          ],
          name: "setText",
          outputs: [],
          stateMutability: "public",
          type: "function",
        },
      ],
      args: [namehash(ensName), "daorequirements", `ipfs://${ensIPFSHash}`],
    }),
  };
};

export const generateSaltNonce = () => {
  return bytesToBigInt(randomBytes(32));
};

export const salt = (initializer: Hex, saltNonce: bigint) => {
  return keccak256(
    encodePacked(["bytes", "uint256"], [keccak256(initializer), saltNonce])
  );
};

const encodeMultiSend = (
  txs: { to: Address; value: bigint; data: Hex; operation: number }[]
): Hex => {
  return `0x${txs
    .map((tx) =>
      encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [
          tx.operation,
          tx.to,
          tx.value,
          BigInt(toBytes(tx.data).length),
          tx.data,
        ]
      ).slice(2)
    )
    .join("")}`;
};

export const getGnosisSafeInitializer = (
  multiSendCallOnlyAddress: Address,
  compatibilityFallbackHandlerAddress: Address,
  owners: Address[]
) => {
  return encodeFunctionData({
    abi: GnosisSafeL2Abi,
    functionName: "setup",
    args: [
      [...owners, multiSendCallOnlyAddress], // _owners
      1n, // _threshold // hardcode to 1
      zeroAddress, // to
      zeroHash, // data
      compatibilityFallbackHandlerAddress, // fallbackHandler
      "0x0000000000000000000000000000000000000000", // paymentToken
      0n, // payment
      "0x0000000000000000000000000000000000000000", // paymentReceiver
    ],
  });
};

export const getFractalModuleInitializer = (
  moduleOwner: Address,
  moduleAvatar: Address
) => {
  return encodeFunctionData({
    abi: FractalModuleAbi,
    functionName: "setUp",
    args: [
      encodeAbiParameters(
        parseAbiParameters("address, address, address, address[]"),
        [
          moduleOwner, // _owner
          moduleAvatar, // _avatar
          moduleAvatar, // _target
          [], // _controllers
        ]
      ),
    ],
  });
};

export const getPredictedSafeAddress = async (
  gnosisSafeProxyFactoryContract: GetContractReturnType<
    typeof GnosisSafeProxyFactoryAbi,
    PublicClient<HttpTransport, Chain>
  >,
  gnosisSafeL2SingletonAddress: Address,
  salt: Hex
) => {
  return getContractAddress({
    bytecode: encodePacked(
      ["bytes", "uint256"],
      [
        await gnosisSafeProxyFactoryContract.read.proxyCreationCode(),
        hexToBigInt(gnosisSafeL2SingletonAddress),
      ]
    ),
    from: gnosisSafeProxyFactoryContract.address,
    opcode: "CREATE2",
    salt: salt,
  });
};

export const createDeploySafeTransaction = (
  gnosisSafeProxyFactoryAddress: Address,
  gnosisSafeL2SingletonAddress: Address,
  gnosisSafeInitializer: Hex,
  saltNonce: bigint
) => {
  return {
    operation: 0,
    to: gnosisSafeProxyFactoryAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: GnosisSafeProxyFactoryAbi,
      functionName: "createProxyWithNonce",
      args: [gnosisSafeL2SingletonAddress, gnosisSafeInitializer, saltNonce],
    }),
  };
};

export const createDeployFractalModuleTransaction = (
  moduleProxyFactoryAddress: Address,
  fractalModuleMasterCopyAddress: Address,
  fractalModuleInitializer: Hex,
  saltNonce: bigint
) => {
  return {
    operation: 0,
    to: moduleProxyFactoryAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: ModuleProxyFactoryAbi,
      functionName: "deployModule",
      args: [
        fractalModuleMasterCopyAddress,
        fractalModuleInitializer,
        saltNonce,
      ],
    }),
  };
};

export const createCleanupTransaction = (
  predictedSafeAddress: Address,
  multiSendCallOnlyAddress: Address,
  fractalModuleMasterCopyAddress: Address,
  moduleProxyFactoryAddress: Address,
  fractalModuleInitializer: Hex,
  saltNonce: bigint,
  owners: Address[],
  threshold: bigint
) => {
  return {
    operation: 0,
    to: predictedSafeAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: GnosisSafeL2Abi,
      functionName: "execTransaction",
      args: [
        multiSendCallOnlyAddress,
        0n,
        encodeFunctionData({
          abi: MultiSendCallOnlyAbi,
          functionName: "multiSend",
          args: [
            encodeMultiSend([
              {
                operation: 0,
                to: predictedSafeAddress,
                value: 0n,
                data: encodeFunctionData({
                  abi: GnosisSafeL2Abi,
                  functionName: "enableModule",
                  args: [
                    getContractAddress({
                      bytecode: `0x602d8060093d393df3363d3d373d3d3d363d73${fractalModuleMasterCopyAddress.slice(
                        2
                      )}5af43d82803e903d91602b57fd5bf3`,
                      from: moduleProxyFactoryAddress,
                      opcode: "CREATE2",
                      salt: salt(fractalModuleInitializer, saltNonce),
                    }),
                  ],
                }),
              },
              {
                operation: 0,
                to: predictedSafeAddress,
                value: 0n,
                data: encodeFunctionData({
                  abi: GnosisSafeL2Abi,
                  functionName: "removeOwner",
                  args: [
                    owners[owners.length - 1],
                    multiSendCallOnlyAddress,
                    threshold,
                  ],
                }),
              },
            ]),
          ],
        }),
        1,
        0n,
        0n,
        0n,
        zeroAddress,
        zeroAddress,
        `0x000000000000000000000000${multiSendCallOnlyAddress.slice(
          2
        )}000000000000000000000000000000000000000000000000000000000000000001`,
      ],
    }),
  };
};
