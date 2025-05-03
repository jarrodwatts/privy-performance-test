"use client";

import { createConfig, http } from "wagmi";
import { abstractTestnet } from "viem/chains";
import { createPublicClient } from "viem";

// Configure wagmi client
export const config = createConfig({
  chains: [abstractTestnet],
  transports: {
    [abstractTestnet.id]: http(),
  },
});

// Create a public client for transaction receipt validation
export const publicClient = createPublicClient({
  chain: abstractTestnet,
  transport: http(),
});

// Wait for transaction receipt function
export const waitForTransaction = async (hash: `0x${string}`) => {
  return await publicClient.waitForTransactionReceipt({
    hash,
    pollingInterval: 500, // Poll every 500ms
  });
};
