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
  erc20Abi,
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
  FractalRegistryAbi,
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

export const createDeclareSubDaoTransaction = (
  fractalRegistryAddress: Address,
  subDaoAddress: Address
) => {
  return {
    operation: 0,
    to: fractalRegistryAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: FractalRegistryAbi,
      functionName: "declareSubDAO",
      args: [subDaoAddress],
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

export const encodeMultiSend = (
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
  multisigOwners: Address[],
  multiSendCallOnlyAddress: Address,
  compatibilityFallbackHandlerAddress: Address
) => {
  return encodeFunctionData({
    abi: GnosisSafeL2Abi,
    functionName: "setup",
    args: [
      [...multisigOwners, multiSendCallOnlyAddress], // _owners
      1n, // _threshold // hardcode to 1
      zeroAddress, // to
      zeroHash, // data
      compatibilityFallbackHandlerAddress, // fallbackHandler
      zeroAddress, // paymentToken
      0n, // payment
      zeroAddress, // paymentReceiver
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

export const getPredictedFractalModuleAddress = (
  moduleMasterCopyAddress: Address,
  moduleProxyFactoryAddress: Address,
  moduleInitializerData: Hex,
  saltNonce: bigint
) => {
  return getContractAddress({
    bytecode: `0x602d8060093d393df3363d3d373d3d3d363d73${moduleMasterCopyAddress.slice(
      2
    )}5af43d82803e903d91602b57fd5bf3`,
    from: moduleProxyFactoryAddress,
    opcode: "CREATE2",
    salt: salt(moduleInitializerData, saltNonce),
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

export const multiSendFunctionData = (
  multiSendTransactions: {
    to: Address;
    value: bigint;
    data: Hex;
    operation: number;
  }[]
) => {
  return encodeFunctionData({
    abi: MultiSendCallOnlyAbi,
    functionName: "multiSend",
    args: [encodeMultiSend(multiSendTransactions)],
  });
};

export const createMultiSendTransaction = (
  multiSendCallOnlyAddress: Address,
  delegateCall: boolean,
  multiSendTransactions: {
    operation: number;
    to: Address;
    value: bigint;
    data: Hex;
  }[]
) => {
  return {
    to: multiSendCallOnlyAddress,
    operation: delegateCall ? 1 : 0,
    value: 0n,
    data: multiSendFunctionData(multiSendTransactions),
  };
};

export const createSafeExecTransaction = (
  safeAddress: Address,
  target: Address,
  data: Hex
) => {
  return {
    operation: 0,
    to: safeAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: GnosisSafeL2Abi,
      functionName: "execTransaction",
      args: [
        target,
        0n,
        data,
        1,
        0n,
        0n,
        0n,
        zeroAddress,
        zeroAddress,
        `0x000000000000000000000000${target.slice(
          2
        )}000000000000000000000000000000000000000000000000000000000000000001`,
      ],
    }),
  };
};

export const createEnableModuleTransaction = (
  safeAddress: Address,
  predictedModuleAddress: Address
) => {
  return {
    operation: 0,
    to: safeAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: GnosisSafeL2Abi,
      functionName: "enableModule",
      args: [predictedModuleAddress],
    }),
  };
};

export const createRemoveOwnerTransaction = (
  safeAddress: Address,
  ownerToRemove: Address,
  otherOwners: Address[],
  threshold: bigint
) => {
  return {
    operation: 0,
    to: safeAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: GnosisSafeL2Abi,
      functionName: "removeOwner",
      args: [otherOwners[otherOwners.length - 1], ownerToRemove, threshold],
    }),
  };
};

export const createUpdateDaoNameTransaction = (
  fractalRegistryAddress: Address,
  daoName: string
) => {
  return {
    operation: 0,
    to: fractalRegistryAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: FractalRegistryAbi,
      functionName: "updateDAOName",
      args: [daoName],
    }),
  };
};

export const createTransferTokensTransactions = (
  tokens: { address: Address; amount: bigint }[],
  recipient: Address
) => {
  return tokens.map((token) => ({
    operation: 0,
    to: token.address,
    value: 0n,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipient, token.amount],
    }),
  }));
};
