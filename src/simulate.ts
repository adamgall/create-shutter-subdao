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

// https://github.com/safe-global/safe-deployments/tree/main/src/assets/v1.3.0

const gnosisSafeProxyFactoryAddress: Address =
  "0xc22834581ebc8527d974f8a1c97e1bea4ef910bc";
const gnosisSafeL2SingletonAddress: Address =
  "0xfb1bffc9d739b8d520daf37df666da4c687191ea";
const moduleProxyFactoryAddress: Address =
  "0xe93e4b198097c4cb3a6de594c90031cdac0b88f3";
const fractalModuleMasterCopyAddress: Address =
  "0x1b26345a4a41d9f588e1b161b6e8f21d27547184";
const multiSendCallOnlyAddress: Address =
  "0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B";

const saltNonce = bytesToBigInt(randomBytes(32));

const salt = (initializer: Hex, saltNonce: bigint) =>
  keccak256(
    encodePacked(["bytes", "uint256"], [keccak256(initializer), saltNonce])
  );

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

export const simulate = async (client: PublicClient) => {
  const gnosisSafeInitializer = encodeFunctionData({
    abi: GnosisSafeL2Abi,
    functionName: "setup",
    args: [
      [
        "0xfcf7a2794D066110162ADdcE3085dfd6221D4ddD",
        "0xDB131c83b44A055750b49107031AA77B633148aB",
        multiSendCallOnlyAddress,
      ], // _owners
      1n, // _threshold // hardcode to 1
      zeroAddress, // to
      zeroHash, // data
      "0x017062a1dE2FE6b99BE3d9d37841FeD19F573804", // fallbackHandler
      "0x0000000000000000000000000000000000000000", // paymentToken
      0n, // payment
      "0x0000000000000000000000000000000000000000", // paymentReceiver
    ],
  });

  const gnosisSafeProxyFactory = getContract({
    address: gnosisSafeProxyFactoryAddress,
    abi: GnosisSafeProxyFactoryAbi,
    client: client,
  });

  const predictedSafeAddress = getContractAddress({
    bytecode: encodePacked(
      ["bytes", "uint256"],
      [
        await gnosisSafeProxyFactory.read.proxyCreationCode(),
        hexToBigInt(gnosisSafeL2SingletonAddress),
      ]
    ),
    from: gnosisSafeProxyFactoryAddress,
    opcode: "CREATE2",
    salt: salt(gnosisSafeInitializer, saltNonce),
  });

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

  const multiSendCallOnly = getContract({
    address: multiSendCallOnlyAddress,
    abi: MultiSendCallOnlyAbi,
    client: client,
  });

  const transaction = await multiSendCallOnly.simulate.multiSend([
    encodeMultiSend([
      {
        operation: 0,
        to: gnosisSafeProxyFactoryAddress,
        value: 0n,
        data: encodeFunctionData({
          abi: GnosisSafeProxyFactoryAbi,
          functionName: "createProxyWithNonce",
          args: [
            gnosisSafeL2SingletonAddress,
            gnosisSafeInitializer,
            saltNonce,
          ],
        }),
      },
      {
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
      },
      {
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
                        "0xDB131c83b44A055750b49107031AA77B633148aB", // TODO address right before last, i guess
                        multiSendCallOnlyAddress,
                        2n, // TODO user input
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
      },
    ]),
  ]);

  console.log(`transaction: ${transaction}`);
};
