"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import chain from "@/constants/chain";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!} // Replace with your actual Privy App ID
        config={{
          // Create embedded wallets for users who don't have a wallet
          embeddedWallets: {
            createOnLogin: "all-users",
            showWalletUIs: false,
          },
          defaultChain: chain,
          supportedChains: [chain],
        }}
      >
        {children}
      </PrivyProvider>
    </WagmiProvider>
  );
}
