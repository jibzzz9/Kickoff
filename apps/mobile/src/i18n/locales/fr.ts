export default {
  common: { email: "Email", password: "Mot de passe", loading: "Chargement…", logout: "Se déconnecter" },
  login: { title: "Content de te revoir", submit: "Se connecter", noAccount: "Pas encore de compte ?", error: "Email ou mot de passe incorrect." },
  signup: {
    title: "Crée ton compte",
    firstName: "Prénom",
    birthDate: "Date de naissance (AAAA-MM-JJ)",
    commune: "Commune",
    parentEmail: "Email d'un parent",
    parentHint: "Tu as moins de {{age}} ans : un parent doit valider ton compte. Il recevra un email.",
    acceptTerms: "J'accepte les conditions d'utilisation et la politique de confidentialité (brouillons).",
    acceptAi: "Je comprends que mon dossier est analysé par une IA, mais que c'est toujours un humain qui décide.",
    submit: "Créer mon compte",
    hasAccount: "Déjà un compte ?",
    error: "Impossible de créer le compte. Vérifie les champs.",
    errors: { invalid_birth_date: "Date de naissance invalide.", parent_email_required: "L'email d'un parent est nécessaire." },
  },
  home: {
    welcome: "Salut {{name}} 👋",
    consentPending: "Ton compte est limité tant qu'un parent n'a pas validé. Demande-lui de regarder ses emails.",
    soon: "Bientôt : les places d'apprentissage près de chez toi.",
  },
};
