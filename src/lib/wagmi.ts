import { http, createConfig } from "wagmi";
import { bsc } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  // fallback so dev doesn't crash; real value injected via env
  "demo";

export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId,
      metadata: {
        name: "Memco",
        description: "Your onchain life, roasted by AI",
        url: "https://memco.app",
        icons: [],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [bsc.id]: http(),
  },
  ssr: true,
});
