import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import SchoolSettingsForm from '@/components/SchoolSettingsForm';
import { auth } from '@/auth';
import { ensureUserSchool, isUserSchoolAdmin, listSchoolStudents } from '@/lib/school';

export default async function EcolePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [school, isAdmin] = await Promise.all([
    ensureUserSchool(session.user.id),
    isUserSchoolAdmin(session.user.id),
  ]);
  const students = isAdmin ? await listSchoolStudents(school.id) : [];

  const byPromotion = students.reduce((acc, s) => {
    const key = s.promotion?.trim() || 'Sans promo';
    (acc[key] ||= []).push(s);
    return acc;
  }, {} as Record<string, typeof students>);

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
            <h3 className="school-class-title">Classe</h3>
            {students.length === 0 ? (
              <p className="folder-empty">Aucun étudiant inscrit pour le moment.</p>
            ) : (
              Object.entries(byPromotion).map(([promo, group]) => (
                <div key={promo} className="school-class-group">
                  <div className="school-class-group-header">
                    <span className="school-class-group-name">{promo}</span>
                    <span className="school-class-group-count">{group.length}</span>
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
                      {group.map((s) => (
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
              ))
            )}
          </div>
        )}
      </section>
    </>
  );
}
