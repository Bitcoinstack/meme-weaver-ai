import { http, createConfig } from "wagmi";
import { mainnet, polygon, arbitrum, bsc } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

// Multi-wallet setup:
// - EIP-6963 multi-injected discovery (default in wagmi v2) surfaces every
//   installed browser wallet (MetaMask, Rabby, Trust, Phantom EVM, etc.) as
//   its OWN named connector with its OWN icon — that's how MetaMask shows up.
// - Coinbase Wallet is added explicitly so it appears even without an extension.
// - We intentionally do NOT include the generic `injected()` fallback, because
//   it grabs whichever wallet wins window.ethereum (was opening Trust by default)
//   and it duplicates as a generic "Injected" entry in the picker.
// - We also do NOT include the `metaMask()` SDK connector — it adds a heavy SDK
//   that can fail to initialize in some preview environments. EIP-6963 already
//   surfaces installed MetaMask cleanly.
export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum],
  multiInjectedProviderDiscovery: true,
  connectors: [coinbaseWallet({ appName: "Memco" })],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});
