// Next.js shows this instantly on every navigation into a (tracker) route,
// while the target page's own async work (auth/DB fetches) still runs —
// without it the browser shows nothing at all until the slowest query on
// the destination page resolves, since none of these routes had a loading
// state before.
export default function Loading() {
  return (
    <div style={{ padding: 24 }}>
      <div className="route-skeleton-bar" style={{ width: '40%' }} />
      <div className="route-skeleton-bar" style={{ width: '70%', marginTop: 16 }} />
      <div className="route-skeleton-bar" style={{ width: '55%', marginTop: 16 }} />
    </div>
  );
}
