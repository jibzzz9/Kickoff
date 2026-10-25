# Kickoff — brief produit (version de référence)

> Brief initial du porteur de projet. Les écarts décidés depuis sont dans `docs/decisions.md`.

## 1. Le produit

« Kickoff, c'est le coach d'orientation dans la poche des jeunes, qui les mène jusqu'à leur contrat d'apprentissage. »
Jeunes de fin de scolarité obligatoire (11e / 3e du CO, 14-17 ans) et entreprises formatrices.

- Jeunes : ne savent pas quel métier choisir ni où chercher, candidatures au hasard, refus sans explication, découragement.
- Entreprises : ~10 000 places vacantes par an en Suisse ; tri des dossiers, entretiens et stages d'essai chronophages.

Deux interfaces reliées en temps réel, un seul backend.

## 2. Architecture

App élève React Native + Expo (TS, Expo Router) ; web entreprise Next.js (App Router, TS, Tailwind) ;
Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) ; IA texte via API Anthropic côté serveur uniquement ;
voix derrière une interface `VoiceProvider` ; Expo Push Notifications ; Stripe plus tard (abonnement Pro).
Monorepo pnpm + Turborepo. TS strict, Zod, RLS partout, clés uniquement côté serveur, Vitest, ESLint/Prettier,
i18n FR (défaut) + DE (Haut-Valais).

## 3. Périmètre MVP

Valais uniquement. 3 métiers pilotes : ASSC CFC, Employé·e de commerce CFC, Logisticien·ne CFC (extensible sans migration lourde).
Places saisies directement par les entreprises (pas de scraping).

## 4. App élève

### 4.1 Onboarding et profil
- Inscription (email ou téléphone), langue.
- Consentement : usage des données et de l'IA. Moins de 16 ans (seuil configurable, à confirmer par un juriste) :
  validation par un parent (email avec lien). Compte limité tant que non validé.
- Profil : prénom, âge, commune, année scolaire, métiers visés, notes/moyenne, tests d'aptitudes (Multicheck, Basic-check :
  champ libre + score), stages d'essai faits, langues, centres d'intérêt, savoir-être.
- Import CV (PDF), lettre de motivation, vidéo de présentation 30 s (option).
- Accès parent / enseignant en lecture (invitation par lien), activable et révocable par le jeune.

### 4.2 Pilier 1 — Trouver
- Liste et carte des places, filtres métier / commune / date de rentrée.
- Temps de trajet en transports publics depuis la commune du jeune (ex. transport.opendata.ch, à valider).
- Score de compatibilité 0-100 % en anneau, toujours expliqué : ce qui correspond, ce qu'il manque + action concrète.
- Postuler en un clic (profil + CV) ; option de réécriture de la lettre par l'IA (le jeune valide, sa voix est conservée).

### 4.3 Pilier 2 — Coach IA
- Chat écrit ou vocal, connaît profil, candidatures, refus, entretiens (contexte injecté côté serveur).
- Propose des alternatives (métier proche, autre commune, autres places) avec liens vers les places réelles.
- Check-up périodique (1, 2, 3 semaines ou 1 mois) : compte rendu (fait, ce qui marche / bloque, nouvelles places,
  2-3 actions). Notification push. Envoi au parent/enseignant si activé.
- Simulateur d'entretien (texte puis voix) adapté au métier et à l'entreprise, avec retour.
- Ton bienveillant, tutoiement, 14-17 ans, jamais de jugement ni de promesse.
- Garde-fous : détresse → empathie + adulte de confiance + 147 (Pro Juventute). Pas de conseils médicaux/juridiques.

### 4.4 Pilier 3 — S'organiser
- Suivi : Envoyée → Relancée → Stage d'essai → Entretien → Contrat (ou Pas cette fois).
- Rappels automatiques (relance après 10 jours…).
- Mes entretiens : à venir, passés, en attente. Rappel la veille et le matin, adresse et itinéraire.
- Choix de créneau pour entretiens et stages, ajout à l'agenda du téléphone.

### 4.5 Motivation (plus tard, prévoir le modèle)
Missions hebdomadaires, progression, mentorat par des apprentis, mini-vidéos, swipe.

## 5. Plateforme entreprise

### 5.1 Compte
Inscription + vérification (IDE / autorisation de former, déclaratif, vérification manuelle admin). Plusieurs utilisateurs, rôles admin / formateur.

### 5.2 Annonce avec critères
Indispensable (stage d'essai, niveau scolaire, test) ; un plus (langues, permis vélomoteur, bénévolat…) ;
ce qui compte le plus (motivation, notes, savoir-être, expérience pratique). Aide IA à la rédaction.
Champs : métier, lieu, rentrée, places, description, contact, dates de stage d'essai.

### 5.3 Jauge IA
- Liste simple par ordre d'arrivée, pas de colonnes ni de tri forcé.
- Carte : prénom, âge, commune, métier, notes, stages, vidéo, lettre ; en bas badge + jauge 5 segments + ligne d'explication :
  🟢 Très intéressant (4-5) · 🔵 Intéressant (3) · 🟡 À découvrir (1-2, autres atouts) · ⚪ Profil incomplet.
  Explication : 2-3 éléments concrets. Libellés toujours positifs.
- « Voir le détail » : critères remplis / non remplis. Filtre « Afficher d'abord les très intéressants » désactivé par défaut.
- Badge et jauge visibles uniquement par l'entreprise.

### 5.4 Actions en un clic
- Entretien : invitation pré-rédigée modifiable + 2-3 créneaux + lieu, personne, quoi apporter → push immédiat,
  le jeune choisit, mise à jour en temps réel. Invitation groupée possible.
- Stage d'essai : idem ; fiche d'évaluation (ponctualité, intérêt, contact équipe, commentaire), partagée au jeune
  seulement s'il l'a accepté.
- Notes privées du formateur.
- Décision : Proposer la place (le jeune accepte/refuse) ; Pas cette fois (message respectueux + conseil, le coach prend le relais) ; Liste d'attente.
- Place pourvue : annonce fermée automatiquement, réponse polie à tous les autres candidats, le coach propose des places similaires.
- Le contrat officiel passe par le canton : afficher étapes et documents.

### 5.5 Statistiques
Vues de l'annonce, nombre de candidatures, délai moyen de réponse.

## 6. Score et IA
- Partie déterministe (testable) : critères vs profil → score 0-100 et segments 0-5.
- Partie IA : uniquement les textes (explication entreprise, conseils élève), à partir du résultat déterministe. Ne change pas le score.
- Même calcul pour le jeune (anneau) et l'entreprise (jauge), présenté différemment. Tests unitaires.
- Garde-fous : aucun rejet automatique ; critères discriminants exclus ; transparence ; journal des calculs avec version d'algorithme ;
  prompts versionnés dans `supabase/functions/_prompts/`.
- Appels IA via Edge Functions ; quotas par utilisateur ; cache des explications ; modèle configurable par variable d'environnement.

## 7. Données personnelles (mineurs)
nLPD (+ RGPD par prudence) : minimisation, finalité, consentement, droit d'accès et de suppression réelle.
Hébergement Suisse ou UE. Buckets privés, URLs signées. Aucune donnée élève visible avant candidature.
Pas de publicité ni revente. Brouillons CGU et politique de confidentialité clairement marqués.

## 8. Modèle économique
Jeunes gratuits (quota raisonnable pour le coach). Kickoff+ familles plus tard (champ `plan`).
Entreprises : Basique gratuit ; Pro (jauge, actions, stages, mise en avant, stats). Pilote : Pro gratuit. Feature flags par plan.

## 9. Identité visuelle
Encre #0B0D1A, lime #C8F135, violet #7C5CFF, corail #FF6B5A, vert #2FD27A, ambre #FFC53D, fond #F6F7FB.
Bricolage Grotesque (titres) + Inter. Logo provisoire : carré arrondi lime, flèche ↗ noire, « kickoff ».
Moderne, énergique, cartes arrondies, micro-animations, mode sombre. AA, cibles ≥ 44 px.

## 10-11. Données et phases
Modèle de données de départ et phases 0 à 6 : voir `docs/decisions.md` et l'historique git.
Phase 0 fondations · 1 annonces et candidatures · 2 score et jauge · 3 entretiens/stages/décisions ·
4 coach IA · 5 voix · 6 pilote et monétisation.
