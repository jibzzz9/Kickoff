/**
 * Textes partagés FR/DE : messages pré-rédigés (modifiables par l'entreprise) et textes des notifications.
 * Sans dépendance ni import : aussi utilisé par l'Edge Function `push` (Deno).
 * Version gratuite par gabarits ; Claude pourra personnaliser les messages en fin de projet.
 */

export type Lang = "fr" | "de";
type Params = Record<string, string | number | null | undefined>;

export const fillTemplate = (s: string, p: Params) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(p[k] ?? ""));

const KIND_LABEL: Record<Lang, Record<string, string>> = {
  fr: { interview: "entretien", trial: "stage d'essai" },
  de: { interview: "Vorstellungsgespräch", trial: "Schnupperlehre" },
};

export const NOTIFICATION_TEXTS: Record<Lang, Record<string, { title: string; body: string }>> = {
  fr: {
    new_application: { title: "Nouvelle candidature", body: "{first_name} a postulé à « {listing} »." },
    invitation: { title: "{company} t'invite 🎉", body: "On te propose un {kind}. Choisis ton créneau dans l'app." },
    slot_chosen: { title: "Créneau choisi", body: "{first_name} a choisi son créneau ({kind})." },
    offer: { title: "Une place pour toi ! 🎉", body: "{company} te propose la place « {listing} ». Réponds dans l'app." },
    offer_accepted: { title: "Place acceptée 🎉", body: "{first_name} a accepté la place « {listing} »." },
    offer_declined: { title: "Réponse à ton offre", body: "{first_name} a décliné la place « {listing} »." },
    not_this_time: { title: "Réponse de {company}", body: "Pas cette fois pour « {listing} ». Ton coach t'aide à rebondir." },
    waitlist: { title: "Liste d'attente", body: "{company} t'a mis·e sur liste d'attente pour « {listing} »." },
    filled: { title: "Place pourvue", body: "La place chez {company} a été pourvue. Merci pour ta candidature ! D'autres places t'attendent." },
    follow_up: { title: "Relance", body: "{first_name} a relancé sa candidature « {listing} »." },
    withdrawn: { title: "Candidature retirée", body: "{first_name} a retiré sa candidature « {listing} »." },
    trial_feedback: { title: "Retour sur ton stage", body: "{company} t'a laissé un retour sur ton stage d'essai." },
    new_message: { title: "Nouveau message", body: "Nouveau message à propos de « {listing} »." },
    follow_up_reminder: { title: "Pense à relancer", body: "Relance {company} : ta candidature date d'il y a {days} jours." },
    appointment_reminder_tomorrow: { title: "C'est demain !", body: "Ton {kind} chez {company}, {time}. Adresse : {location}." },
    appointment_reminder_today: { title: "C'est aujourd'hui !", body: "Ton {kind} chez {company}, {time}. Bonne chance !" },
    checkup_ready: { title: "Ton check-up est prêt", body: "Découvre ton bilan et tes prochaines actions." },
  },
  de: {
    new_application: { title: "Neue Bewerbung", body: "{first_name} hat sich auf «{listing}» beworben." },
    invitation: { title: "{company} lädt dich ein 🎉", body: "Du bekommst eine Einladung ({kind}). Wähle deinen Termin in der App." },
    slot_chosen: { title: "Termin gewählt", body: "{first_name} hat einen Termin gewählt ({kind})." },
    offer: { title: "Eine Lehrstelle für dich! 🎉", body: "{company} bietet dir die Stelle «{listing}» an. Antworte in der App." },
    offer_accepted: { title: "Stelle angenommen 🎉", body: "{first_name} hat die Stelle «{listing}» angenommen." },
    offer_declined: { title: "Antwort auf dein Angebot", body: "{first_name} hat die Stelle «{listing}» abgelehnt." },
    not_this_time: { title: "Antwort von {company}", body: "Diesmal nicht für «{listing}». Dein Coach hilft dir weiter." },
    waitlist: { title: "Warteliste", body: "{company} hat dich für «{listing}» auf die Warteliste gesetzt." },
    filled: { title: "Stelle besetzt", body: "Die Stelle bei {company} ist besetzt. Danke für deine Bewerbung! Andere Stellen warten auf dich." },
    follow_up: { title: "Nachfrage", body: "{first_name} hat zur Bewerbung «{listing}» nachgefragt." },
    withdrawn: { title: "Bewerbung zurückgezogen", body: "{first_name} hat die Bewerbung «{listing}» zurückgezogen." },
    trial_feedback: { title: "Rückmeldung zur Schnupperlehre", body: "{company} hat dir eine Rückmeldung zur Schnupperlehre gegeben." },
    new_message: { title: "Neue Nachricht", body: "Neue Nachricht zu «{listing}»." },
    follow_up_reminder: { title: "Denk ans Nachfragen", body: "Frag bei {company} nach: Deine Bewerbung ist {days} Tage alt." },
    appointment_reminder_tomorrow: { title: "Morgen ist es so weit!", body: "Dein Termin ({kind}) bei {company}, {time}. Adresse: {location}." },
    appointment_reminder_today: { title: "Heute ist es so weit!", body: "Dein Termin ({kind}) bei {company}, {time}. Viel Glück!" },
    checkup_ready: { title: "Dein Check-up ist bereit", body: "Entdecke deine Bilanz und deine nächsten Schritte." },
  },
};

/** Titre et texte d'une notification, dans la langue du destinataire. */
export function notificationText(lang: Lang, type: string, params: Params): { title: string; body: string } {
  const key = type === "appointment_reminder" ? `appointment_reminder_${params.when === "today" ? "today" : "tomorrow"}` : type;
  const tpl = NOTIFICATION_TEXTS[lang][key] ?? NOTIFICATION_TEXTS[lang].new_message!;
  const startsAt = typeof params.starts_at === "string" ? new Date(params.starts_at) : null;
  const p: Params = {
    ...params,
    kind: KIND_LABEL[lang][String(params.appointment_kind ?? "interview")] ?? "",
    time: startsAt
      ? new Intl.DateTimeFormat(lang === "de" ? "de-CH" : "fr-CH", { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich" }).format(startsAt)
      : "",
  };
  return { title: fillTemplate(tpl.title, p), body: fillTemplate(tpl.body, p) };
}

export type MessageTemplateKind = "invitation_interview" | "invitation_trial" | "offer" | "not_this_time" | "waitlist";

export const MESSAGE_TEMPLATES: Record<Lang, Record<MessageTemplateKind, string>> = {
  fr: {
    invitation_interview:
      "Bonjour {firstName},\n\nMerci pour ta candidature chez {company} ! Nous aimerions faire ta connaissance lors d'un entretien. Pas de stress : c'est surtout l'occasion de discuter et de répondre à tes questions.\n\nChoisis le créneau qui te convient le mieux directement dans l'app.\n\nÀ bientôt !\n{sender}",
    invitation_trial:
      "Bonjour {firstName},\n\nMerci pour ta candidature chez {company} ! Nous te proposons de venir découvrir le métier pendant un stage d'essai, avec notre équipe.\n\nChoisis la date qui te convient le mieux directement dans l'app.\n\nNous nous réjouissons de t'accueillir !\n{sender}",
    offer:
      "Bonjour {firstName},\n\nBonne nouvelle : nous avons le plaisir de te proposer la place d'apprentissage « {listing} » chez {company} ! Tu peux accepter ou refuser directement dans l'app.\n\nSi tu acceptes, nous préparerons ensemble le contrat d'apprentissage, qui sera validé par le canton.\n\nFélicitations !\n{sender}",
    not_this_time:
      "Bonjour {firstName},\n\nMerci beaucoup pour ta candidature et pour le temps que tu nous as consacré. Pour cette place, nous avons choisi une autre personne. Ce n'est pas une remise en question de ce que tu vaux : ton parcours ne fait que commencer.\n\n{tip}\n\nNous te souhaitons plein de succès dans ta recherche !\n{sender}",
    waitlist:
      "Bonjour {firstName},\n\nMerci pour ta candidature chez {company}. Ton profil nous plaît : nous t'avons placé·e sur notre liste d'attente. Si une place se libère, nous te contacterons en priorité.\n\nEn attendant, continue ta recherche, c'est important !\n{sender}",
  },
  de: {
    invitation_interview:
      "Hallo {firstName}\n\nDanke für deine Bewerbung bei {company}! Wir möchten dich gerne in einem Vorstellungsgespräch kennenlernen. Keine Sorge: Es geht vor allem darum, miteinander zu reden und deine Fragen zu beantworten.\n\nWähle den Termin, der dir am besten passt, direkt in der App.\n\nBis bald!\n{sender}",
    invitation_trial:
      "Hallo {firstName}\n\nDanke für deine Bewerbung bei {company}! Wir laden dich zu einer Schnupperlehre bei unserem Team ein, damit du den Beruf kennenlernen kannst.\n\nWähle das Datum, das dir am besten passt, direkt in der App.\n\nWir freuen uns auf dich!\n{sender}",
    offer:
      "Hallo {firstName}\n\nGute Nachricht: Wir freuen uns, dir die Lehrstelle «{listing}» bei {company} anzubieten! Du kannst direkt in der App annehmen oder ablehnen.\n\nWenn du annimmst, bereiten wir zusammen den Lehrvertrag vor, der vom Kanton genehmigt wird.\n\nHerzliche Gratulation!\n{sender}",
    not_this_time:
      "Hallo {firstName}\n\nVielen Dank für deine Bewerbung und deine Zeit. Für diese Stelle haben wir uns für eine andere Person entschieden. Das sagt nichts über deinen Wert aus: Dein Weg fängt gerade erst an.\n\n{tip}\n\nWir wünschen dir viel Erfolg bei deiner Suche!\n{sender}",
    waitlist:
      "Hallo {firstName}\n\nDanke für deine Bewerbung bei {company}. Dein Profil gefällt uns: Wir haben dich auf unsere Warteliste gesetzt. Wenn eine Stelle frei wird, melden wir uns zuerst bei dir.\n\nSuch in der Zwischenzeit unbedingt weiter!\n{sender}",
  },
};

/** Conseil concret ajouté au message « Pas cette fois », tiré des actions du moteur de score. */
export const TIP_TEXTS: Record<Lang, Record<string, string>> = {
  fr: {
    do_trial: "Un conseil : un stage d'essai dans le métier fait souvent la différence auprès des entreprises.",
    take_aptitude_test: "Un conseil : passer un test d'aptitudes (Multicheck, Basic-check) renforcera tes prochaines candidatures.",
    write_letter: "Un conseil : une lettre de motivation personnalisée pour chaque entreprise fait vraiment la différence.",
    learn_language: "Un conseil : montrer tes progrès dans une deuxième langue est un vrai plus en Valais.",
    get_moped_license: "Un conseil : le permis vélomoteur peut t'ouvrir plus de places, surtout pour les horaires tôt le matin.",
    try_volunteering: "Un conseil : un engagement bénévole montre ta motivation et ta fiabilité.",
    improve_average: "Un conseil : continue à t'accrocher à l'école, tes efforts se verront dans tes prochains bulletins.",
    default: "Un conseil : continue à postuler et à faire des stages d'essai, chaque expérience te rapproche du but.",
  },
  de: {
    do_trial: "Ein Tipp: Eine Schnupperlehre im Beruf macht bei Betrieben oft den Unterschied.",
    take_aptitude_test: "Ein Tipp: Ein Eignungstest (Multicheck, Basic-check) stärkt deine nächsten Bewerbungen.",
    write_letter: "Ein Tipp: Ein persönliches Motivationsschreiben für jeden Betrieb macht wirklich den Unterschied.",
    learn_language: "Ein Tipp: Fortschritte in einer zweiten Sprache sind im Wallis ein echtes Plus.",
    get_moped_license: "Ein Tipp: Mit der Mofaprüfung kommen mehr Stellen in Frage, vor allem bei frühen Arbeitszeiten.",
    try_volunteering: "Ein Tipp: Freiwilliges Engagement zeigt deine Motivation und Zuverlässigkeit.",
    improve_average: "Ein Tipp: Bleib in der Schule dran, deine Anstrengungen zeigen sich in den nächsten Zeugnissen.",
    default: "Ein Tipp: Bewirb dich weiter und mach Schnupperlehren, jede Erfahrung bringt dich näher ans Ziel.",
  },
};

export function messageTemplate(
  lang: Lang,
  kind: MessageTemplateKind,
  p: { firstName?: string | null; company?: string | null; listing?: string | null; sender?: string | null; tipAction?: string | null },
): string {
  const tip = TIP_TEXTS[lang][p.tipAction ?? ""] ?? TIP_TEXTS[lang].default;
  // Sans prénom (invitation groupée) : « Bonjour , » devient « Bonjour, » et « Hallo  » devient « Hallo ».
  return fillTemplate(MESSAGE_TEMPLATES[lang][kind], { ...p, tip })
    .replace(/ +,/g, ",")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}
