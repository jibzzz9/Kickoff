/**
 * BROUILLONS des textes légaux (FR/DE). À faire valider par un juriste avant toute mise en service.
 * Les passages entre crochets [ ] sont à compléter.
 */
export type LegalDoc = { title: string; sections: { heading: string; body: string[] }[] };
export const LEGAL_DRAFT_DATE = "2026-10-25";

const fr: Record<"terms" | "privacy", LegalDoc> = {
  privacy: {
    title: "Politique de confidentialité",
    sections: [
      { heading: "Qui est responsable ?", body: ["[Nom et adresse de l'entité exploitant Kickoff], [email de contact pour la protection des données]."] },
      { heading: "Quelles données ?", body: [
        "Élèves : prénom, date de naissance, commune, langue, année scolaire, notes, tests d'aptitudes, stages d'essai, langues parlées, centres d'intérêt, qualités, CV et lettres déposés, candidatures et échanges avec les entreprises.",
        "Nous ne collectons pas le nom de famille, l'adresse exacte, la nationalité, l'origine, la religion ni de données de santé.",
        "Entreprises : nom, numéro IDE, commune, coordonnées des personnes de contact, annonces et décisions.",
        "Parents et enseignants invités : adresse email et date d'acceptation de l'invitation.",
      ] },
      { heading: "Pourquoi ?", body: [
        "Aider les jeunes à trouver une place d'apprentissage et les entreprises formatrices à recruter : proposer des places, calculer une compatibilité, transmettre une candidature, organiser entretiens et stages d'essai, envoyer des rappels.",
        "Aucune publicité, aucune revente de données, aucun profilage à d'autres fins.",
      ] },
      { heading: "Intelligence artificielle et décision humaine", body: [
        "Un calcul automatique compare le profil aux critères de l'annonce. Il éclaire la lecture du dossier mais ne rejette jamais personne : c'est toujours une personne de l'entreprise qui décide.",
        "Le calcul n'utilise ni le nom, ni l'âge, ni le genre, ni l'origine. Sa méthode est décrite publiquement et chaque résultat est journalisé avec la version de l'algorithme.",
      ] },
      { heading: "Qui voit quoi ?", body: [
        "Une entreprise ne voit le dossier d'un·e jeune qu'après une candidature chez elle, et uniquement les informations utiles (prénom, âge, commune, parcours, documents joints).",
        "Les parents ou enseignants invités par le jeune voient ses candidatures et rendez-vous en lecture seule, jamais ses messages. Le jeune peut retirer cet accès à tout moment.",
      ] },
      { heading: "Mineurs", body: ["Kickoff s'adresse à des jeunes de 14 à 17 ans. [À valider par un juriste : conditions d'utilisation par les mineurs et information des représentants légaux.] Le jeune peut inviter un parent ou un enseignant à suivre sa recherche en lecture seule."] },
      { heading: "Hébergement et sécurité", body: ["Données hébergées en Suisse ou dans l'Union européenne [préciser le prestataire et la région]. Accès protégé, fichiers privés, liens de téléchargement temporaires."] },
      { heading: "Durée de conservation", body: ["[À définir : par exemple, suppression des comptes inactifs après 24 mois ; candidatures conservées au plus 12 mois après la rentrée concernée.]"] },
      { heading: "Vos droits", body: [
        "Accès et copie de vos données (bouton « Télécharger mes données »), rectification, suppression réelle (bouton « Supprimer mon compte »), opposition.",
        "Contact : [email]. Vous pouvez aussi vous adresser au Préposé fédéral à la protection des données et à la transparence (PFPDT).",
      ] },
    ],
  },
  terms: {
    title: "Conditions d'utilisation",
    sections: [
      { heading: "Le service", body: ["Kickoff met en relation des jeunes en recherche de place d'apprentissage et des entreprises formatrices du Valais. Kickoff ne garantit pas l'obtention d'une place."] },
      { heading: "Gratuité pour les jeunes", body: ["L'utilisation est gratuite pour les jeunes. Les entreprises disposent d'une offre de base gratuite et d'une offre Pro [conditions à préciser]."] },
      { heading: "Engagements des entreprises", body: [
        "Publier des annonces réelles et à jour, disposer de l'autorisation de former, répondre aux candidats avec respect.",
        "Ne pas discriminer, ne pas utiliser les données des candidats à d'autres fins que le recrutement concerné.",
        "Les décisions de recrutement sont prises par l'entreprise ; le calcul de compatibilité n'est qu'une aide.",
      ] },
      { heading: "Engagements des utilisateurs", body: ["Fournir des informations exactes, respecter les autres utilisateurs, ne pas usurper l'identité d'autrui."] },
      { heading: "Contrat d'apprentissage", body: ["Le contrat d'apprentissage officiel est conclu entre l'entreprise, le jeune et son représentant légal, puis validé par le canton. Kickoff ne le remplace pas."] },
      { heading: "Responsabilité", body: ["[Clause de limitation de responsabilité à rédiger.]"] },
      { heading: "Droit applicable", body: ["Droit suisse. For : [à préciser]."] },
    ],
  },
};

const de: Record<"terms" | "privacy", LegalDoc> = {
  privacy: {
    title: "Datenschutzerklärung",
    sections: [
      { heading: "Wer ist verantwortlich?", body: ["[Name und Adresse der Betreiberin von Kickoff], [E-Mail für Datenschutzfragen]."] },
      { heading: "Welche Daten?", body: [
        "Jugendliche: Vorname, Geburtsdatum, Gemeinde, Sprache, Schuljahr, Noten, Eignungstests, Schnupperlehren, Sprachkenntnisse, Interessen, Stärken, hochgeladene Lebensläufe und Schreiben, Bewerbungen und Austausch mit Betrieben.",
        "Nicht erhoben werden Nachname, genaue Adresse, Nationalität, Herkunft, Religion und Gesundheitsdaten.",
        "Betriebe: Name, UID-Nummer, Gemeinde, Kontaktangaben, Inserate und Entscheide.",
        "Eingeladene Eltern und Lehrpersonen: E-Mail-Adresse und Datum der Annahme.",
      ] },
      { heading: "Wozu?", body: [
        "Jugendlichen bei der Lehrstellensuche und Lehrbetrieben bei der Rekrutierung helfen: Lehrstellen vorschlagen, Übereinstimmung berechnen, Bewerbungen übermitteln, Gespräche und Schnupperlehren organisieren, Erinnerungen senden.",
        "Keine Werbung, kein Verkauf von Daten, kein Profiling zu anderen Zwecken.",
      ] },
      { heading: "Künstliche Intelligenz und menschlicher Entscheid", body: [
        "Eine automatische Berechnung vergleicht das Profil mit den Kriterien des Inserats. Sie hilft beim Lesen, lehnt aber nie jemanden ab: Es entscheidet immer ein Mensch im Betrieb.",
        "Die Berechnung verwendet weder Name, Alter, Geschlecht noch Herkunft. Die Methode ist öffentlich beschrieben, jedes Resultat wird mit der Version des Algorithmus protokolliert.",
      ] },
      { heading: "Wer sieht was?", body: [
        "Ein Betrieb sieht die Unterlagen erst nach einer Bewerbung bei ihm und nur die nötigen Angaben.",
        "Eingeladene Eltern oder Lehrpersonen sehen Bewerbungen und Termine nur lesend, nie die Nachrichten. Der Zugang kann jederzeit widerrufen werden.",
      ] },
      { heading: "Minderjährige", body: ["Kickoff richtet sich an Jugendliche von 14 bis 17 Jahren. [Von einer juristischen Fachperson zu prüfen: Nutzung durch Minderjährige und Information der gesetzlichen Vertretung.] Die Jugendlichen können einen Elternteil oder eine Lehrperson einladen, ihre Suche nur lesend mitzuverfolgen."] },
      { heading: "Hosting und Sicherheit", body: ["Daten in der Schweiz oder der EU gehostet [Anbieter und Region präzisieren]. Geschützter Zugang, private Dateien, zeitlich begrenzte Download-Links."] },
      { heading: "Aufbewahrungsdauer", body: ["[Festzulegen.]"] },
      { heading: "Ihre Rechte", body: [
        "Auskunft und Kopie (Knopf «Meine Daten herunterladen»), Berichtigung, echte Löschung (Knopf «Konto löschen»), Widerspruch.",
        "Kontakt: [E-Mail]. Sie können sich auch an den Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) wenden.",
      ] },
    ],
  },
  terms: {
    title: "Nutzungsbedingungen",
    sections: [
      { heading: "Der Dienst", body: ["Kickoff verbindet Jugendliche auf Lehrstellensuche mit Walliser Lehrbetrieben. Kickoff garantiert keine Lehrstelle."] },
      { heading: "Kostenlos für Jugendliche", body: ["Für Jugendliche ist die Nutzung kostenlos. Betriebe haben ein kostenloses Basis-Angebot und ein Pro-Angebot [Bedingungen präzisieren]."] },
      { heading: "Pflichten der Betriebe", body: [
        "Echte und aktuelle Inserate, Ausbildungsbewilligung, respektvoller Umgang mit den Bewerbenden.",
        "Keine Diskriminierung, keine Nutzung der Daten ausserhalb der betreffenden Rekrutierung.",
        "Entscheide trifft der Betrieb; die Übereinstimmung ist nur eine Hilfe.",
      ] },
      { heading: "Pflichten der Nutzenden", body: ["Korrekte Angaben, Respekt gegenüber anderen, keine fremde Identität."] },
      { heading: "Lehrvertrag", body: ["Der offizielle Lehrvertrag wird zwischen Betrieb, Jugendlicher/m und gesetzlicher Vertretung abgeschlossen und vom Kanton genehmigt. Kickoff ersetzt ihn nicht."] },
      { heading: "Haftung", body: ["[Haftungsbeschränkung zu formulieren.]"] },
      { heading: "Anwendbares Recht", body: ["Schweizer Recht. Gerichtsstand: [zu präzisieren]."] },
    ],
  },
};

export const LEGAL = { fr, de };
