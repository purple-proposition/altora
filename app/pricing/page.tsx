import Link from 'next/link';
import Icon from '@/components/Icon';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import QuoteCtaButton from '@/components/QuoteCtaButton';
import '../tracker.css';

// Public pricing page (added to middleware.ts PUBLIC_PATHS). Structure
// mirrors fabric.so/pricing-and-plans-for-individuals (tiered plan cards,
// FAQ) but the numbers are honest to Altora's real model per
// Altora_Concept_Projet.docx: schools subscribe (B2B, quote-based — no
// fixed price is defined yet), students are included for free through
// their school, and pricing for secondary targets (cabinets de
// recrutement, agences d'intérim) isn't decided yet either — the FAQ says
// so plainly instead of inventing numbers to fill the gap. All three plans
// show together (no Écoles/Étudiants toggle) since there are only three of
// them total.
export default function PricingPage() {
  return (
    <div className="landing">
      <SiteNav />

      <div className="landing-card">
      <main className="pricing-hero">
        <span className="landing-eyebrow">Tarifs</span>
        <h1 className="pricing-title">Un tarif pour chaque acteur de l&apos;alternance</h1>
        <p className="landing-subtitle">
          L&apos;accès étudiant est inclus dans l&apos;abonnement de l&apos;école.
          Les écoles souscrivent à la plateforme, avec un accompagnement humain
          disponible en option.
        </p>
      </main>

      <section className="pricing-plans">
        <div className="pricing-plan">
          <span className="pricing-plan-badge">Le plus complet</span>
          <h2 className="pricing-plan-name">Abonnement SaaS</h2>
          <p className="pricing-plan-tagline">La plateforme complète pour votre établissement</p>
          <div className="pricing-plan-price">Sur devis</div>
          <p className="pricing-plan-price-note">Selon la taille de votre promotion</p>
          <QuoteCtaButton className="landing-nav-cta pricing-plan-cta">Contacter un expert</QuoteCtaButton>
          <ul className="pricing-plan-features">
            <li><Icon name="check-circle" />Gestion des étudiants et des offres partenaires</li>
            <li><Icon name="check-circle" />Tableaux de bord et suivi des candidatures</li>
            <li><Icon name="check-circle" />Copilote IA pour l&apos;équipe pédagogique</li>
            <li><Icon name="check-circle" />Statistiques de placement de la promotion</li>
          </ul>
        </div>

        <div className="pricing-plan">
          <h2 className="pricing-plan-name">Accompagnement Premium</h2>
          <p className="pricing-plan-tagline">En complément de l&apos;abonnement</p>
          <div className="pricing-plan-price">Sur devis</div>
          <p className="pricing-plan-price-note">Service ajouté à l&apos;abonnement SaaS</p>
          <Link href="/signup" className="landing-nav-cta pricing-plan-cta pricing-plan-cta--secondary">Nous contacter</Link>
          <ul className="pricing-plan-features">
            <li><Icon name="check-circle" />Prospection de nouvelles entreprises</li>
            <li><Icon name="check-circle" />Prise de contact et qualification des besoins</li>
            <li><Icon name="check-circle" />Organisation des entretiens, relances</li>
            <li><Icon name="check-circle" />Suivi jusqu&apos;à la signature du contrat</li>
          </ul>
        </div>

        <div className="pricing-plan">
          <h2 className="pricing-plan-name">Étudiant</h2>
          <p className="pricing-plan-tagline">Pour toute la durée de ton alternance</p>
          <div className="pricing-plan-price">Gratuit</div>
          <p className="pricing-plan-price-note">Inclus si ton école utilise Altora</p>
          <Link href="/signup" className="landing-nav-cta pricing-plan-cta">Créer mon compte</Link>
          <ul className="pricing-plan-features">
            <li><Icon name="check-circle" />Tableau de suivi de tes candidatures</li>
            <li><Icon name="check-circle" />CV et lettre de motivation générés par IA</li>
            <li><Icon name="check-circle" />Score de matching sur chaque offre</li>
            <li><Icon name="check-circle" />CV structuré pour passer les ATS</li>
          </ul>
        </div>
      </section>

      <section className="pricing-faq">
        <h2 className="pricing-faq-title">Questions fréquentes</h2>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Les étudiants paient-ils pour utiliser Altora ?</h3>
          <p className="pricing-faq-answer">
            Non. L&apos;accès étudiant est inclus dans l&apos;abonnement souscrit par
            leur école.
          </p>
        </div>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Comment est calculé le prix de l&apos;abonnement école ?</h3>
          <p className="pricing-faq-answer">
            Sur devis, selon la taille de votre promotion et les fonctionnalités
            activées &mdash; contactez-nous pour un chiffrage.
          </p>
        </div>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Qu&apos;est-ce que l&apos;Accompagnement Premium ?</h3>
          <p className="pricing-faq-answer">
            Un service humain en complément de la plateforme : notre équipe prend
            en charge la prospection d&apos;entreprises partenaires, les relances et
            le suivi jusqu&apos;à la signature du contrat.
          </p>
        </div>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Proposez-vous une offre pour les cabinets de recrutement ou les agences d&apos;intérim ?</h3>
          <p className="pricing-faq-answer">
            Pas encore &mdash; cette offre est en cours de construction. Contactez-nous
            pour en discuter.
          </p>
        </div>
      </section>

      <SiteFooter />
      </div>
    </div>
  );
}
