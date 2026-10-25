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
| 9 | `node-linker=hoisted` (`.npmrc`) | Metro (Expo) résout mal les symlinks pnpm dans un monorepo |
| 10 | Profil / élève / entreprise créés par trigger SQL `handle_new_user` depuis les métadonnées d'inscription | Atomique, impossible de créer un compte sans profil. Rôle limité à student / company_user ; consentement parental calculé côté base |
| 11 | Email d'invitation au parent : hors Phase 0 | Demande une Edge Function + un service d'envoi d'emails (à choisir, coût) |
| 12 | Date de naissance saisie en texte AAAA-MM-JJ au MVP | Sélecteur de date natif à ajouter en Phase 1 |
| 13 | Une annonce n'est visible par les élèves que si l'entreprise est vérifiée | Protection des mineurs : pas d'annonce d'une entreprise non contrôlée |
| 14 | Un élève dont le consentement parental est en attente ne peut pas postuler | « Compte limité » du brief, imposé par la RLS |
| 15 | Table `communes` : 30 communes valaisannes, coordonnées approximatives | Suffisant pour la carte du pilote ; à remplacer par la liste officielle OFS |
| 16 | Filtres de la liste des places calculés dans l'app | Quelques dizaines d'annonces au pilote ; à déplacer côté serveur si le volume grandit |
| 17 | Carte : `react-native-maps` | Fonctionne dans Expo Go. Un build Android de production demandera une clé Google Maps SDK (gratuite pour l'affichage mobile, à confirmer) |
| 18 | Une seule version de React dans le monorepo (`pnpm.overrides`) | Deux copies de React cassaient le build Next.js |
| 19 | Un critère peut exister une fois en « indispensable » et une fois en « un plus » | Ex. allemand indispensable + français en plus |
| 20 | Nom de famille non collecté | Minimisation des données ; rien à masquer côté entreprise |
| 21 | Entreprises : accès aux CV uniquement via URL signée de 5 min, et seulement pour un CV joint à une candidature reçue | Bucket privé + politique de stockage |
| 22 | Reportés : rédaction d'annonce par IA, réécriture de lettre par IA (Phase 2, clé Anthropic), temps de trajet (API à valider) | Services externes, à valider avant |
| 23 | **Mode d'opération : gratuit d'abord, payant à la fin** (demande du porteur) | Chaque service payant est caché derrière une interface avec une version gratuite par défaut |

## À brancher à la fin (payant)

| Service | Utilisé pour | Version gratuite en attendant |
|---|---|---|
| API Anthropic (Claude) | Explications de score, conseils, coach, rédaction d'annonce, réécriture de lettre, simulateur d'entretien | Textes générés par règles et gabarits FR/DE |
| Fournisseur voix (STT/TTS) | Coach vocal, simulateur vocal | Interface `VoiceProvider` sans implémentation |
| Fournisseur d'emails (production) | Email au parent, réponses aux candidats | Mailpit en local (`http://127.0.0.1:54324`) |
| Stripe | Abonnement Pro | Feature flags par plan, Pro offert au pilote |
| Clé Google Maps (Android, production) | Carte Android publiée | Expo Go sans clé |
| Comptes Apple Developer / Google Play | Publication | Expo Go / builds de développement |
| Projet Supabase cloud (offre payante si dépassement) | Hébergement | Supabase local ; l'offre gratuite suffit au pilote |
