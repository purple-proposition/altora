'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { OPEN_QUOTE_MODAL_EVENT } from '@/components/QuoteCtaButton';
import { trackEvent } from '@/lib/gtag';

// HubSpot Forms API v3 — submits straight from the browser, no backend
// or API key needed (the form GUID is the only thing scoping this to
// our HubSpot account, not a secret). Field names on the left are this
// form's own `name` attributes; the right side are the internal HubSpot
// property names for the "Altora" form, given by the account owner.
const HUBSPOT_ENDPOINT = 'https://api-eu1.hsforms.com/submissions/v3/integration/submit/148576052/579970d8-cdc4-4c9a-9144-e32362ab215c';
const HUBSPOT_FIELD_MAP: Record<string, string> = {
  firstName: 'firstname',
  lastName: 'lastname',
  email: 'email',
  organization: 'ecole_ou_organisme',
  size: 'nombre_detudiants',
  message: 'message',
};

// Shared "Demander un devis" modal, mounted once (in SiteNav, present on
// every public page) and opened from anywhere via a window event — see
// QuoteCtaButton. Submits to HubSpot on the account's own "Altora" form.
export default function QuoteModal() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_QUOTE_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_QUOTE_MODAL_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setSubmitted(false);
    setError(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(false);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const fields = Object.entries(HUBSPOT_FIELD_MAP)
      .map(([inputName, hubspotName]) => ({ name: hubspotName, value: (formData.get(inputName) as string) || '' }))
      .filter((field) => field.value !== '');

    try {
      const res = await fetch(HUBSPOT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          context: {
            pageUri: window.location.href,
            pageName: document.title,
          },
        }),
      });
      if (!res.ok) throw new Error(`HubSpot submission failed: ${res.status}`);
      // GA4's own recommended event name for exactly this ("someone
      // submitted a lead-gen form") — marked as a key event/conversion
      // in the property so it shows up as one everywhere in GA4's UI,
      // not just as a raw event.
      trackEvent('generate_lead');
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="quote-modal-overlay" onClick={close}>
      <div className="quote-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="quote-modal-close" aria-label="Fermer" onClick={close}>
          <Icon name="x" />
        </button>
        {submitted ? (
          <div className="quote-modal-success">
            <h2 className="quote-modal-title">Demande envoyée</h2>
            <p className="quote-modal-text">
              Merci, votre demande a bien été transmise. Un membre de
              l&apos;équipe Altora vous recontacte sous peu.
            </p>
          </div>
        ) : (
          <>
            <h2 className="quote-modal-title">Contacter un expert</h2>
            <p className="quote-modal-text">
              Parlez-nous de votre école ou de votre organisme de
              formation, un expert Altora revient vers vous rapidement.
            </p>
            <form className="quote-modal-form" onSubmit={onSubmit}>
              <div className="quote-modal-field-row">
                <label className="quote-modal-field">
                  <span>Prénom *</span>
                  <input type="text" name="firstName" required />
                </label>
                <label className="quote-modal-field">
                  <span>Nom *</span>
                  <input type="text" name="lastName" required />
                </label>
              </div>
              <label className="quote-modal-field">
                <span>Email professionnel *</span>
                <input type="email" name="email" required />
              </label>
              <label className="quote-modal-field">
                <span>École ou organisme *</span>
                <input type="text" name="organization" required />
              </label>
              <label className="quote-modal-field">
                <span>Nombre d&apos;étudiants (approximatif)</span>
                <input type="text" name="size" />
              </label>
              <label className="quote-modal-field">
                <span>Message</span>
                <textarea name="message" rows={3} />
              </label>
              {error && (
                <p className="quote-modal-error">
                  L&apos;envoi a échoué. Réessayez, ou écrivez-nous directement si ça persiste.
                </p>
              )}
              <button type="submit" className="landing-nav-cta quote-modal-submit" disabled={submitting}>
                {submitting ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
