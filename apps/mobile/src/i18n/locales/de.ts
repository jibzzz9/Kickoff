export default {
  common: { email: "E-Mail", password: "Passwort", loading: "Lädt…", logout: "Abmelden" },
  login: { title: "Schön, dich wiederzusehen", submit: "Anmelden", noAccount: "Noch kein Konto?", error: "E-Mail oder Passwort falsch." },
  signup: {
    title: "Erstelle dein Konto",
    firstName: "Vorname",
    birthDate: "Geburtsdatum (JJJJ-MM-TT)",
    commune: "Gemeinde",
    parentEmail: "E-Mail eines Elternteils",
    parentHint: "Du bist unter {{age}}: Ein Elternteil muss dein Konto bestätigen. Er oder sie erhält eine E-Mail.",
    acceptTerms: "Ich akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung (Entwürfe).",
    acceptAi: "Ich verstehe, dass meine Unterlagen von einer KI analysiert werden, aber immer ein Mensch entscheidet.",
    submit: "Konto erstellen",
    hasAccount: "Schon ein Konto?",
    error: "Konto konnte nicht erstellt werden. Prüfe die Felder.",
    errors: { invalid_birth_date: "Ungültiges Geburtsdatum.", parent_email_required: "Die E-Mail eines Elternteils ist nötig." },
  },
  home: {
    welcome: "Hallo {{name}} 👋",
    consentPending: "Dein Konto ist eingeschränkt, bis ein Elternteil bestätigt hat. Bitte ihn oder sie, die E-Mails zu prüfen.",
    soon: "Bald: Lehrstellen in deiner Nähe.",
  },
};
