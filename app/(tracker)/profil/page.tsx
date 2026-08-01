import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import ProfileForm from '@/components/ProfileForm';
import { auth } from '@/auth';
import { getUserProfile, emptyProfile } from '@/lib/profile';

export default async function ProfilPage() {
  const session = await auth();
  const profile = session?.user?.id
    ? (await getUserProfile(session.user.id)) ?? emptyProfile(session.user.name ?? '', session.user.email ?? '')
    : emptyProfile();

  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <SidebarCollapseToggle />
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="user-cog"></i>Mon profil candidat</span>
          <TopbarActions />
        </div>
      </div>

      <section className="profile-view">
        <div className="profile-view-header">
          <h1 className="profile-view-title">Mon profil candidat</h1>
          <p className="profile-view-hint">
            Ces informations servent de base à la génération de ton CV et de tes lettres de motivation.
            Import un CV depuis la fenêtre « Profil » pour pré-remplir automatiquement, puis corrige ici si besoin.
          </p>
        </div>
        <ProfileForm initialProfile={profile} />
      </section>
    </>
  );
}
