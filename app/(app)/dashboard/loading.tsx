export default function Loading() {
  return (
    <div role="status" aria-label="Loading" style={{ height: "100%", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pl-bg-app)" }}>
      <span style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid var(--pl-border)", borderTopColor: "var(--pl-accent)", animation: "plSpin .7s linear infinite" }} />
    </div>
  );
}
