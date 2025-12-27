export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          SoukHub
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-powered agent for multi-channel marketplace sellers
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <h3 className="font-semibold">Amazon</h3>
            <p className="text-sm text-muted-foreground">UAE Marketplace</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <h3 className="font-semibold">Cartlow</h3>
            <p className="text-sm text-muted-foreground">FBS/FBC</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <h3 className="font-semibold">Revibe</h3>
            <p className="text-sm text-muted-foreground">Multi-Region</p>
          </div>
        </div>
      </div>
    </main>
  );
}
