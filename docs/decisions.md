# Décisions techniques

| # | Décision | Raison |
|---|---|---|
| 1 | Monorepo pnpm + Turborepo | Partage de `shared` et `ui-tokens` entre mobile et web |
| 2 | Auth MVP : email + mot de passe | Le SMS (téléphone) est payant ; repoussé |
| 3 | Seuil de consentement parental dans `app_settings` (16 ans) | À confirmer par un juriste, donc configurable |
| 4 | Région Supabase : Zurich (`eu-central-2`) sinon Francfort | Hébergement Suisse/UE (nLPD) |
| 5 | Tests RLS en pgTAP | Vérifier l'isolation des données en CI |
| 6 | Pas de champs nationalité/genre/religion/santé en base | Impossible de les utiliser dans un score |
| 7 | Entreprises : accès aux élèves via une vue `candidate_cards` seulement | Aucune donnée visible avant candidature |
| 8 | Bundle id provisoire `ch.kickoff.app` | À remplacer quand le domaine est fixé |
