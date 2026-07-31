import Link from 'next/link';

type InboxMessage = {
  senderName: string;
  senderEmail: string;
  avatar: string;
  subject: string;
  preview: string;
  time: string;
  unread?: boolean;
};

const MESSAGES: InboxMessage[] = [
  {
    senderName: 'Rocket School',
    senderEmail: 'contact@rocket-school.eu',
    avatar: '/rocket-school-logo.jpg',
    subject: 'Job Dating Marketing & Digital — inscriptions ouvertes',
    preview: "Rocket School organise un job dating avec une dizaine d'entreprises partenaires le 18 septembre à Lyon. Places limitées, inscris-toi depuis ton espace élève avant le 10 septembre pour réserver ton créneau.",
    time: '09:14',
    unread: true,
  },
];

export default function InboxPage() {
  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="mail"></i>Boîte de réception</span>
        </div>
      </div>

      <section className="documents-view">
        <div className="documents-header">
          <h2 className="documents-title">Boîte de réception</h2>
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
