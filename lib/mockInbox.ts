export type InboxMessage = {
  senderName: string;
  senderEmail: string;
  avatar: string;
  subject: string;
  preview: string;
  time: string;
  unread?: boolean;
};

export const INBOX_MESSAGES: InboxMessage[] = [
  {
    senderName: 'Rocket School',
    senderEmail: 'contact@rocket-school.eu',
    avatar: '/rocket-school-logo.jpg',
    subject: 'Job Dating Marketing & Digital : inscriptions ouvertes',
    preview: "Rocket School organise un job dating avec une dizaine d'entreprises partenaires le 18 septembre à Lyon. Places limitées, inscris-toi depuis ton espace élève avant le 10 septembre pour réserver ton créneau.",
    time: '09:14',
    unread: true,
  },
  {
    senderName: 'Rocket School',
    senderEmail: 'contact@rocket-school.eu',
    avatar: '/rocket-school-logo.jpg',
    subject: 'Rappel : évaluations B3 les 24, 25 et 26 juin',
    preview: 'Le planning détaillé des évaluations écrites et orales de fin de semestre est disponible sur ton espace élève. Pense à confirmer ton créneau de passage avant le 15 juin.',
    time: 'Hier',
    unread: true,
  },
  {
    senderName: 'Rocket School',
    senderEmail: 'contact@rocket-school.eu',
    avatar: '/rocket-school-logo.jpg',
    subject: 'Nouvelle ressource : guide CV & lettre pour l\'alternance 2026',
    preview: "L'équipe pédagogique met à disposition un guide complet pour préparer ta recherche d'alternance : trames CV, exemples de lettres, conseils d'entretien. Disponible dans l'espace ressources.",
    time: 'Il y a 3 jours',
    unread: false,
  },
];
