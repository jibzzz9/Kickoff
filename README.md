# Kickoff

Plateforme suisse (Valais) qui aide les jeunes à trouver une place d'apprentissage et les entreprises à recruter.

## Démarrer en local

Prérequis : Node 22, pnpm 10, Docker.

```bash
pnpm install
npx supabase start          # base de données locale (affiche l'URL et la clé publishable)
cp apps/web/.env.example apps/web/.env.local        # puis renseigner la clé publishable
cp apps/mobile/.env.example apps/mobile/.env        # idem
pnpm --filter @kickoff/web dev        # http://localhost:3000
pnpm --filter @kickoff/mobile start   # QR code pour Expo Go
```

## Comptes de démo (données fictives)

Créés par `npx supabase db reset`. Mot de passe : `demo1234`.

| Compte | Rôle |
|---|---|
| `ems@demo.kickoff.ch` | Entreprise EMS Les Tilleuls (Sion) |
| `pharmacie@demo.kickoff.ch` | Entreprise Pharmacie du Rhône (Martigny) |
| `garage@demo.kickoff.ch` | Entreprise Garage Alpin (Brig-Glis, en allemand) |
| `logistique@demo.kickoff.ch` | Entreprise Logistique du Simplon SA (Visp) |
| `boulangerie@demo.kickoff.ch` | Entreprise **non vérifiée** : ses annonces sont invisibles pour les élèves |
| `lea@demo.kickoff.ch` | Élève, 16 ans, Sion, profil complet |
| `noah@demo.kickoff.ch` | Élève, 15 ans, consentement parental validé, 1 candidature |
| `mia@demo.kickoff.ch` | Élève, 14 ans, consentement en attente : ne peut pas encore postuler |

Une entreprise créée depuis le web n'est pas vérifiée. Pour la vérifier en local :

```bash
docker exec supabase_db_kickoff psql -U postgres -c "update companies set verified_at = now() where name = 'Nom de l''entreprise';"
```

## Vérifications

```bash
pnpm lint && pnpm typecheck && pnpm test   # JS/TS
npx supabase db reset && npx supabase test db   # migrations + tests RLS
```

Décisions techniques : `docs/decisions.md`.
