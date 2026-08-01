import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import SchoolSettingsForm from '@/components/SchoolSettingsForm';
import { auth } from '@/auth';
import { ensureUserSchool, isUserSchoolAdmin, listSchoolStudents, type SchoolStudent } from '@/lib/school';

// Démo : cette promo n'a encore qu'un seul vrai compte inscrit (l'admin qui teste
// la page) — ces entrées permettent de visualiser la vue "Classe" en attendant
// les vraies inscriptions.
const DEMO_STUDENTS: SchoolStudent[] = [
  { id: 'demo-1', name: 'Lina Bensaïd', email: 'lina.bensaid@spoutnik75.fr', promotion: 'Spoutnik 75', isSchoolAdmin: false, createdAt: '2026-09-02', cardCount: 6 },
  { id: 'demo-2', name: 'Nathan Perret', email: 'nathan.perret@spoutnik75.fr', promotion: 'Spoutnik 75', isSchoolAdmin: false, createdAt: '2026-09-02', cardCount: 3 },
  { id: 'demo-3', name: 'Inès Chartier', email: 'ines.chartier@spoutnik75.fr', promotion: 'Spoutnik 75', isSchoolAdmin: false, createdAt: '2026-09-03', cardCount: 9 },
  { id: 'demo-4', name: 'Yanis Kader', email: 'yanis.kader@spoutnik75.fr', promotion: 'Spoutnik 75', isSchoolAdmin: false, createdAt: '2026-09-04', cardCount: 0 },
  { id: 'demo-5', name: 'Chloé Fontaine', email: 'chloe.fontaine@spoutnik75.fr', promotion: 'Spoutnik 75', isSchoolAdmin: false, createdAt: '2026-09-04', cardCount: 4 },
  { id: 'demo-6', name: 'Mehdi Rouault', email: 'mehdi.rouault@spoutnik75.fr', promotion: 'Spoutnik 75', isSchoolAdmin: false, createdAt: '2026-09-05', cardCount: 2 },
];

export default async function EcolePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [school, isAdmin] = await Promise.all([
    ensureUserSchool(session.user.id),
    isUserSchoolAdmin(session.user.id),
  ]);
  const realStudents = isAdmin ? await listSchoolStudents(school.id) : [];
  const students = realStudents.length > 1 ? realStudents : [...realStudents, ...DEMO_STUDENTS];

  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <SidebarCollapseToggle />
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="graduation-cap"></i>École</span>
          <TopbarActions />
        </div>
      </div>

      <section className="school-view">
        <div className="school-view-header">
          <h2 className="school-view-title">{school.name}</h2>
          <p className="school-view-hint">
            Le rythme d&apos;alternance et la date de rentrée définis ici s&apos;appliquent automatiquement au CV de tous les étudiants de l&apos;école — ils ne peuvent pas les modifier eux-mêmes.
          </p>
        </div>

        {isAdmin ? (
          <SchoolSettingsForm initialSchool={school} />
        ) : (
          <div className="school-readonly-card">
            <div className="field-group">
              <span className="field-label">Rythme d&apos;alternance</span>
              <p className="school-readonly-value">{school.rhythm || 'Non renseigné'}</p>
            </div>
            <div className="field-group">
              <span className="field-label">Rentrée</span>
              <p className="school-readonly-value">{school.availability || 'Non renseignée'}</p>
            </div>
            <p className="field-hint">Seul l&apos;admin de l&apos;école peut modifier ces réglages.</p>
          </div>
        )}

        {isAdmin && (
          <div className="school-class">
            <div className="school-class-group-header">
              <h3 className="school-class-title">Classe — Spoutnik 75</h3>
              <span className="school-class-group-count">{students.length}</span>
            </div>
            <table className="school-students-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Candidatures</th>
                  <th>Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name || '—'}{s.isSchoolAdmin && <span className="school-admin-badge">admin</span>}</td>
                    <td>{s.email}</td>
                    <td>{s.cardCount}</td>
                    <td>{new Date(s.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
