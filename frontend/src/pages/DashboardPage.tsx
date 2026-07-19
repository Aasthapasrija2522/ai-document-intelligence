function DashboardPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#10151F' }}
    >
      <div className="text-center">
        <p
          className="text-[11px] tracking-[0.2em] uppercase mb-2"
          style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Access Granted — Session Active
        </p>
        <h1
          className="text-3xl"
          style={{ color: '#ECEEF3', fontFamily: "'Source Serif 4', serif", fontWeight: 600 }}
        >
          Document Intelligence Dashboard
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}
        >
          Your documents, search, and chat will appear here.
        </p>
      </div>
    </div>
  );
}

export default DashboardPage;