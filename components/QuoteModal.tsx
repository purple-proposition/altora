'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { OPEN_QUOTE_MODAL_EVENT } from '@/components/QuoteCtaButton';

// Shared "Demander un devis" modal, mounted once (in SiteNav, present on
// every public page) and opened from anywhere via a window event — see
// QuoteCtaButton. No backend yet: submitting just shows a confirmation
// state instead of actually sending the request anywhere.
export default function QuoteModal() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
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
              <label className="quote-modal-field">
                <span>Nom complet</span>
                <input type="text" name="name" required />
              </label>
              <label className="quote-modal-field">
                <span>Email professionnel</span>
                <input type="email" name="email" required />
              </label>
              <label className="quote-modal-field">
                <span>École ou organisme</span>
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
              <button type="submit" className="landing-nav-cta quote-modal-submit">Envoyer la demande</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
