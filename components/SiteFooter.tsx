import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="landing-footer">
      <span>© {new Date().getFullYear()} Altora</span>
      <div className="landing-footer-links">
        <Link href="/pricing" className="landing-footer-link">Tarifs</Link>
        <Link href="/login" className="landing-footer-link">Se connecter</Link>
      </div>
    </footer>
  );
}
