import {
  PublicClient,
  bytesToBigInt,
  encodeFunctionData,
  getContract,
} from "viem";
import { GnosisSafeL2Abi, GnosisSafeProxyFactoryAbi } from "./abis";
import { randomBytes } from "crypto";

export const simulate = async (publicClient: PublicClient) => {
  const gnosisSafeProxyFactory = getContract({
    address: "0xc22834581ebc8527d974f8a1c97e1bea4ef910bc",
    abi: GnosisSafeProxyFactoryAbi,
    client: publicClient,
  });

  const simulation = await gnosisSafeProxyFactory.simulate.createProxyWithNonce(
    [
      "0xfb1bffc9d739b8d520daf37df666da4c687191ea", // Gnosis Safe L2 Singleton
      encodeFunctionData({
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
      }),
      bytesToBigInt(randomBytes(32)), // saltNonce
    ]
  );

  console.log({ simulation });
};
