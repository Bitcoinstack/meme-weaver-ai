import { Link } from "@tanstack/react-router";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import penguin from "@/assets/penguin-hero.png";

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    const injected = connectors.find((c) => c.id === "injected") || connectors[0];
    if (injected) connect({ connector: injected });
  };

  return (
    <header className="sticky top-0 z-50 border-b-4 border-ink bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={penguin} alt="Memco" className="h-10 w-10" width={40} height={40} />
          <span className="font-display text-3xl text-ink tracking-tight">MEMCO</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-sans font-semibold text-ink">
          <a href="#how" className="hover:text-roast transition-colors">How it works</a>
          <a href="#sample" className="hover:text-roast transition-colors">Sample</a>
          <a href="#faq" className="hover:text-roast transition-colors">FAQ</a>
        </nav>
        {isConnected && address ? (
          <div className="flex items-center gap-2">
            <Link
              to="/roast"
              className="border-4 border-ink bg-primary px-3 py-2 font-display text-sm md:text-base text-ink shadow-pop-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              ROAST ME →
            </Link>
            <button
              onClick={() => disconnect()}
              className="border-4 border-ink bg-cream px-3 py-2 font-display text-sm text-ink shadow-pop-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              title={address}
            >
              {shorten(address)}
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isPending}
            className="border-4 border-ink bg-primary px-4 py-2 font-display text-base md:text-lg text-ink shadow-pop-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-60"
          >
            {isPending ? "CONNECTING…" : "CONNECT WALLET"}
          </button>
        )}
      </div>
    </header>
  );
}
