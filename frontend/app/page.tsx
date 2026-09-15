import { NftDashboard } from "@/components/NftDashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-6 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">MyNft</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Create an NFT, look it up by number, then approve or send it. Connect
            MetaMask on the local network to get started.
          </p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
        <NftDashboard />
      </main>
    </div>
  );
}
