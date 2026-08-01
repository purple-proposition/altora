import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import { INBOX_MESSAGES as MESSAGES } from '@/lib/mockInbox';

export default function InboxPage() {
  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <SidebarCollapseToggle />
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="mail"></i>Boîte de réception</span>
          <TopbarActions />
        </div>
      </div>

      <section className="documents-view">
        <div className="documents-header">
          <h1 className="documents-title">Boîte de réception</h1>
        </div>

        {MESSAGES.length ? (
          <div className="inbox-list">
            {MESSAGES.map((message, i) => (
              <div className={`inbox-message${message.unread ? ' inbox-message--unread' : ''}`} key={i}>
                <img className="inbox-message-avatar" src={message.avatar} alt={message.senderName} />
                <div className="inbox-message-body">
                  <div className="inbox-message-top">
                    <span className="inbox-message-sender">{message.senderName}</span>
                    <span className="inbox-message-email">{message.senderEmail}</span>
                    <span className="inbox-message-time">{message.time}</span>
                  </div>
                  <span className="inbox-message-subject">{message.subject}</span>
                  <p className="inbox-message-preview">{message.preview}</p>
                </div>
                {message.unread && <span className="inbox-message-unread-dot"></span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="folder-card">
            <div className="folder-card-body">
              <p className="folder-empty">Aucun message pour le moment.</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
