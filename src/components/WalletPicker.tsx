import { useConnect, type Connector } from "wagmi";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Friendly labels for connector ids that don't carry a nice name themselves.
const ID_LABELS: Record<string, string> = {
  metaMaskSDK: "MetaMask",
  metaMask: "MetaMask",
  coinbaseWalletSDK: "Coinbase Wallet",
  coinbaseWallet: "Coinbase Wallet",
  injected: "Browser Wallet",
};

function labelFor(c: Connector) {
  return c.name || ID_LABELS[c.id] || c.id;
}

export function WalletPicker({ open, onClose }: Props) {
  const { connectors, connect, isPending, error } = useConnect();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Hide the generic "Injected" fallback (it duplicates a real EIP-6963 wallet)
  // and dedupe by display label (EIP-6963 sometimes surfaces MetaMask twice).
  const seen = new Set<string>();
  const list = connectors
    .filter((c) => c.id !== "injected" && c.type !== "injected" || c.name)
    .filter((c) => {
      const key = labelFor(c).toLowerCase();
      if (key === "injected" || key === "browser wallet") return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border-4 border-ink bg-cream p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-3xl text-ink">PICK A WALLET</h3>
          <button
            onClick={onClose}
            className="border-4 border-ink bg-cream px-2 font-display text-ink shadow-pop-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {list.map((c) => (
            <button
              key={c.uid}
              disabled={isPending}
              onClick={() => {
                connect(
                  { connector: c },
                  { onSuccess: () => onClose() },
                );
              }}
              className="flex items-center gap-3 border-4 border-ink bg-primary px-4 py-3 font-display text-lg text-ink shadow-pop-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-60"
            >
              {c.icon && (
                <img src={c.icon} alt="" className="h-7 w-7" />
              )}
              <span className="flex-1 text-left">{labelFor(c)}</span>
              <span className="font-sans text-xs text-ink/60">→</span>
            </button>
          ))}
        </div>
        {error && (
          <p className="mt-4 font-sans text-sm text-roast">{error.message}</p>
        )}
        <p className="mt-4 font-sans text-xs text-ink/60">
          Memco only reads public on-chain data — no signatures, no approvals.
        </p>
      </div>
    </div>
  );
}
