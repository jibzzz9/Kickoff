# Kickoff — instructions pour Claude Code

Plateforme suisse (Valais) : app élève (Expo) + web entreprise (Next.js) + backend Supabase.
Le brief produit complet est dans `docs/brief.md` ; les décisions techniques dans `docs/decisions.md`.

## Mode d'opération (demandé par le porteur du projet)

1. **Tout ce qui est gratuit d'abord, tout ce qui est payant à la fin.**
   Les fonctionnalités qui dépendent d'un service payant (API Anthropic/Claude, voix, Stripe,
   fournisseur d'emails en production, clé Google Maps, comptes Apple/Google Play, projet Supabase payant)
   sont construites derrière une interface avec une implémentation gratuite par défaut
   (règles déterministes, gabarits de texte, Mailpit en local…), puis branchées en toute fin de projet.
   Liste à jour dans `docs/decisions.md`, section « À brancher à la fin (payant) ».
2. Le porteur n'est pas développeur expérimenté : expliquer simplement, donner les commandes exactes.
3. Une phase à la fois, petits commits clairs. À la fin de chaque phase : ce qui marche, comment tester, ce qui reste.
4. Jamais de clé secrète dans le code. Toute décision technique va dans `docs/decisions.md`.

## Avancement

Phases 0 à 4 et 6 faites pour la partie gratuite (voir README). Restent, à la fin : branchement de Claude
(explications, coach, simulateur, rédaction), voix (Phase 5), Stripe, fournisseur d'emails, publication sur les stores.

## Règles techniques

- TypeScript strict, Zod (schémas partagés dans `packages/shared`).
- RLS activée sur toutes les tables, sans exception. Tests pgTAP dans `supabase/tests`.
- Aucun texte en dur : i18n FR (défaut) + DE. Les fichiers de traduction doivent avoir les mêmes clés (testé).
- IA : uniquement côté serveur, ne change jamais le score, ne rejette jamais personne. Un humain décide toujours.
- Critères discriminants (nom, photo, nationalité, genre, origine, religion, adresse exacte, santé) : jamais
  dans le calcul ni dans les prompts. Le nom de famille n'est pas collecté.
- Libellés de la jauge entreprise toujours positifs ; la jauge n'est jamais visible par l'élève.

## Commandes

```bash
pnpm install
dockerd &                                   # si Docker n'est pas démarré (session cloud)
npx supabase start -x studio,logflare,vector,imgproxy
npx supabase db reset                       # migrations + seed de démo (mot de passe demo1234)
npx supabase test db                        # tests RLS
npx supabase functions serve                # Edge Functions (dans la session cloud : voir « Pièges »)
pnpm --filter @kickoff/mobile web           # aperçu web de l'app élève (captures Playwright possibles)
pnpm lint && pnpm typecheck && pnpm test    # JS/TS
pnpm --filter @kickoff/web build
```

## Structure

- `apps/mobile` : Expo Router, i18next. `apps/web` : Next.js App Router, next-intl, Tailwind.
- `packages/shared` : schémas Zod, constantes, types DB générés (`npx supabase gen types typescript --local`),
  moteur de score (`src/scoring.ts`, sans dépendance, importé aussi par les Edge Functions).
- `packages/ui-tokens` : couleurs, typo, espacements.
- `supabase/migrations`, `supabase/tests`, `supabase/functions`, `supabase/seed.sql`.

## Pièges connus

- `node-linker=hoisted` (Metro) : une seule version de React imposée par `pnpm.overrides` dans `package.json`.
- Ne pas tuer un processus avec `pkill -f "<texte>"` : le motif correspond au shell lui-même. Utiliser `lsof -ti :PORT`.
- Les tests pgTAP doivent filtrer sur leurs propres données (le seed de démo est chargé en CI).
- Session cloud uniquement : le conteneur des Edge Functions ne fait pas confiance au proxy TLS. Copier
  `/root/.ccr/ca-bundle.crt` dans `supabase/functions/.certs/ca.crt` (ignoré par git) et lancer
  `npx supabase functions serve --env-file supabase/functions/.env.sandbox` avec dans ce fichier
  `SSL_CERT_FILE`, `DENO_CERT` (chemin du certificat) et `DENO_TLS_CA_STORE=mozilla,system`.
  Un seul `functions serve` à la fois (sinon le conteneur est tué, code 137).
