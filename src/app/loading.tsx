export default function Loading() {
  return (
    <main className="pvg-loader-page" aria-label="Loading page">
      <div className="pvg-loader-card" role="status" aria-live="polite">
        <div className="pvg-loader-orbit" aria-hidden="true">
          <span className="pvg-loader-gem" />
        </div>
        <p className="pvg-loader-title">Preparing your page</p>
        <div className="pvg-loader-line" aria-hidden="true" />
      </div>
    </main>
  );
}
