# Kickoff

Plateforme suisse (Valais) qui aide les jeunes à trouver une place d'apprentissage et les entreprises à recruter.
Brief : `docs/brief.md` · Décisions : `docs/decisions.md` · Calcul du score : `docs/scoring.md`

## État du projet

| Phase | Contenu | État |
|---|---|---|
| 0 | Monorepo, Supabase, RLS, comptes élève/entreprise, FR/DE, CI | ✅ |
| 1 | Annonces avec critères, places (liste/carte), profil + CV, candidature en temps réel | ✅ |
| 2 | Score déterministe, jauge entreprise, anneau élève, « ce qu'il te manque » | ✅ (explications par règles) |
| 3 | Entretiens, stages d'essai, décisions, place pourvue, notifications, rappels | ✅ (messages par gabarits) |
| 4 | Check-ups périodiques, places suggérées, écran Coach, aide 147 | ✅ partie gratuite — chat IA et simulateur à la fin |
| 5 | Voix | ⏳ payant, à la fin |
| 6 | Accès parent/enseignant, stats, offres, pages légales (brouillons), export et suppression des données, trajets | ✅ partie gratuite — Stripe et publication à la fin |

Tout ce qui est payant est listé dans `docs/decisions.md`, section « À brancher à la fin (payant) ».

## Démarrer en local

Prérequis : Node 22, pnpm 10, Docker.

```bash
pnpm install
npx supabase start                    # base de données locale (affiche l'URL et la clé « publishable »)
npx supabase db reset                 # migrations + données de démo
cp apps/web/.env.example apps/web/.env.local        # coller la clé publishable
cp apps/mobile/.env.example apps/mobile/.env        # idem (IP de l'ordinateur pour un vrai téléphone)
cp supabase/functions/.env.example supabase/functions/.env
npx supabase functions serve          # Edge Functions (score, notifications, emails, trajets…), dans un autre terminal
pnpm --filter @kickoff/web dev        # http://localhost:3000
pnpm --filter @kickoff/mobile start   # QR code pour Expo Go
pnpm --filter @kickoff/mobile web     # aperçu de l'app élève dans le navigateur (sans téléphone)
```

Les emails (invitations parent/enseignant) arrivent dans la boîte de test locale : http://127.0.0.1:54324

## Comptes de démo (données fictives)

Créés par `npx supabase db reset`. Mot de passe : `demo1234`.

| Compte | Rôle |
|---|---|
| `ems@demo.kickoff.ch` | Entreprise EMS Les Tilleuls (Sion) — 3 candidatures de démo |
| `pharmacie@demo.kickoff.ch` | Entreprise Pharmacie du Rhône (Martigny) |
| `garage@demo.kickoff.ch` | Entreprise Garage Alpin (Brig-Glis, en allemand) |
| `logistique@demo.kickoff.ch` | Entreprise Logistique du Simplon SA (Visp) |
| `boulangerie@demo.kickoff.ch` | Entreprise **non vérifiée** : ses annonces sont invisibles pour les élèves |
| `lea@demo.kickoff.ch` | Élève, 16 ans, Sion, profil complet |
| `noah@demo.kickoff.ch` | Élève, 15 ans, Sierre, 1 candidature |
| `mia@demo.kickoff.ch` | Élève, 14 ans, germanophone (Brig-Glis) |
| `elias@demo.kickoff.ch`, `sara@demo.kickoff.ch` | Élèves aux profils variés (jauge « incomplet » / « à découvrir ») |

Une entreprise créée depuis le web n'est pas vérifiée. Pour la vérifier en local :

```bash
docker exec supabase_db_kickoff psql -U postgres -c "update companies set verified_at = now() where name = 'Nom de l''entreprise';"
```

## Vérifications

```bash
pnpm lint && pnpm typecheck && pnpm test   # JS/TS (Vitest)
npx supabase test db                       # tests de sécurité des données (pgTAP)
```
