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

## Vérifications

```bash
pnpm lint && pnpm typecheck && pnpm test   # JS/TS
npx supabase db reset && npx supabase test db   # migrations + tests RLS
```

Décisions techniques : `docs/decisions.md`.
