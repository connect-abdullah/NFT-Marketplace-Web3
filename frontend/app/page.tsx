import { NftDashboard } from "@/components/NftDashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-6">
          <p className="text-xs tracking-[0.2em] text-ochre uppercase">
            Local gallery
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            NFT Marketplace
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Mint an NFT in Studio, approve the marketplace, list it, then buy or
            send it from a connected wallet on the local network.
          </p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
        <NftDashboard />
      </main>
    </div>
  );
}
