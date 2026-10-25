/**
 * Données FICTIVES du mode démo (aperçu en ligne sans serveur). Reprend le seed de démo (supabase/seed.sql) :
 * l'élève Léa (Sion), 5 annonces en Valais et une invitation de l'EMS Les Tilleuls en attente de réponse.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export type Tables = Record<string, Row[]>;

const COMMUNES: [string, string, string, number, number][] = [
  ["sion", "Sion", "fr", 46.2331, 7.3606], ["sierre", "Sierre", "fr", 46.292, 7.5326], ["martigny", "Martigny", "fr", 46.1028, 7.0726],
  ["monthey", "Monthey", "fr", 46.255, 6.954], ["conthey", "Conthey", "fr", 46.2236, 7.3036], ["saviese", "Savièse", "fr", 46.252, 7.346],
  ["fully", "Fully", "fr", 46.138, 7.114], ["collombey-muraz", "Collombey-Muraz", "fr", 46.273, 6.948], ["saint-maurice", "Saint-Maurice", "fr", 46.218, 7.003],
  ["val-de-bagnes", "Val de Bagnes", "fr", 46.08, 7.212], ["crans-montana", "Crans-Montana", "fr", 46.311, 7.481], ["nendaz", "Nendaz", "fr", 46.187, 7.293],
  ["vetroz", "Vétroz", "fr", 46.22, 7.278], ["saxon", "Saxon", "fr", 46.15, 7.175], ["chamoson", "Chamoson", "fr", 46.202, 7.224],
  ["riddes", "Riddes", "fr", 46.172, 7.224], ["grone", "Grône", "fr", 46.252, 7.459], ["chalais", "Chalais", "fr", 46.266, 7.508],
  ["ayent", "Ayent", "fr", 46.278, 7.413], ["vouvry", "Vouvry", "fr", 46.337, 6.89], ["orsieres", "Orsières", "fr", 46.029, 7.146],
  ["brig-glis", "Brig-Glis", "de", 46.3159, 7.9878], ["visp", "Visp", "de", 46.2937, 7.8815], ["naters", "Naters", "de", 46.3254, 7.9897],
  ["leuk", "Leuk", "de", 46.317, 7.634], ["steg-hohtenn", "Steg-Hohtenn", "de", 46.315, 7.748], ["raron", "Raron", "de", 46.312, 7.8],
  ["salgesch", "Salgesch", "de", 46.311, 7.571], ["zermatt", "Zermatt", "de", 46.0207, 7.7491], ["saas-fee", "Saas-Fee", "de", 46.108, 7.927],
];

/** UUID déterministe (les schémas de l'app exigent des identifiants au format UUID). */
export const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

export const LEA_ID = uuid(1);
export const ID = {
  profAssc: uuid(10), profCommerce: uuid(11), profLog: uuid(12),
  ems: uuid(20), pharma: uuid(21), garageKv: uuid(22), garageLog: uuid(23), simplon: uuid(24),
  appEms: uuid(30), apptEms: uuid(31), slot1: uuid(32), slot2: uuid(33), msg1: uuid(34), notif1: uuid(35), notif2: uuid(36), report1: uuid(37),
};
export const communeId = (code: string) => uuid(100 + COMMUNES.findIndex((c) => c[0] === code));

const day = 864e5;
const iso = (ms: number) => new Date(ms).toISOString();
/** Date à J+n, à une heure donnée (heure suisse, approximée en UTC+1). */
export const slotAt = (days: number, hour: number, minute = 0) => {
  const d = new Date(Date.now() + days * day);
  d.setUTCHours(hour - 1, minute, 0, 0);
  return d.toISOString();
};


/** Temps de trajet en transports publics depuis Sion (minutes, relevés sur transport.opendata.ch). */
export const TRANSIT_FROM_SION: Record<string, number> = { martigny: 14, "brig-glis": 29, visp: 26, sierre: 10 };

const WEIGHTS = (motivation: number, grades: number, soft: number, practical: number) =>
  ({ motivation, grades, soft_skills: soft, practical_experience: practical });

export function createDemoData(): Tables {
  const now = Date.now();
  const communes = COMMUNES.map(([code, name, language, lat, lng]) => ({ id: communeId(code), code, name, language, lat, lng, canton: "VS" }));
  const professions = [
    { id: ID.profAssc, code: "assc", name_fr: "Assistant·e en soins et santé communautaire", name_de: "Fachperson Gesundheit EFZ", type: "CFC", active: true },
    { id: ID.profCommerce, code: "employe-commerce", name_fr: "Employé·e de commerce", name_de: "Kauffrau/Kaufmann EFZ", type: "CFC", active: true },
    { id: ID.profLog, code: "logisticien", name_fr: "Logisticien·ne", name_de: "Logistiker/in EFZ", type: "CFC", active: true },
  ];
  const companies: Record<string, string> = {
    ems: "EMS Les Tilleuls", pharma: "Pharmacie du Rhône", garage: "Garage Alpin", simplon: "Logistique du Simplon SA",
  };
  const trialDates = ["2027-01-11", "2027-02-08", "2027-03-15"];
  const listings = [
    { id: ID.ems, company: "ems", profession_id: ID.profAssc, commune: "sion", places_count: 2, contact_name: "Claire Fournier",
      title: "Apprentissage ASSC dans une équipe bienveillante", weights: WEIGHTS(3, 1, 3, 2), created: 6,
      description: "Tu aimes aider les autres ? Chez nous, tu accompagnes les résidents au quotidien : soins, repas, animations. Une équipe soudée te forme pendant 3 ans." },
    { id: ID.pharma, company: "pharma", profession_id: ID.profCommerce, commune: "martigny", places_count: 1, contact_name: "Julien Roduit",
      title: "Employé·e de commerce en pharmacie", weights: WEIGHTS(2, 3, 2, 1), created: 5,
      description: "Accueil, commandes, facturation : tu découvres toutes les facettes du commerce dans une pharmacie au cœur de Martigny." },
    { id: ID.garageKv, company: "garage", profession_id: ID.profCommerce, commune: "brig-glis", places_count: 1, contact_name: "Marco Imboden",
      title: "Kaufmann/Kauffrau EFZ im Garage", weights: WEIGHTS(3, 2, 2, 1), created: 4,
      description: "Du betreust Kundinnen und Kunden am Empfang, planst Termine und lernst die Buchhaltung eines Familienbetriebs kennen." },
    { id: ID.garageLog, company: "garage", profession_id: ID.profLog, commune: "brig-glis", places_count: 1, contact_name: "Marco Imboden",
      title: "Logistiker/in EFZ – Ersatzteillager", weights: WEIGHTS(3, 1, 2, 3), created: 3,
      description: "Ersatzteile annehmen, lagern und ausliefern: Bei uns bist du das Herz der Werkstatt." },
    { id: ID.simplon, company: "simplon", profession_id: ID.profLog, commune: "visp", places_count: 3, contact_name: "Sandra Zenklusen",
      title: "Logisticien·ne CFC – plateforme de distribution", weights: WEIGHTS(2, 1, 2, 3), created: 2,
      description: "Réception, stockage et préparation des commandes pour tout le Haut-Valais. Formation au chariot élévateur incluse." },
  ].map((l) => ({
    id: l.id, company_name: companies[l.company], profession_id: l.profession_id, commune_id: communeId(l.commune),
    title: l.title, description: l.description, start_date: "2027-08-16", places_count: l.places_count,
    contact_name: l.contact_name, trial_dates: trialDates, weights: l.weights, status: "open", address: null,
    created_at: iso(now - l.created * day),
  }));
  const crit = (listing_id: string, kind: string, key: string, value: unknown) => ({ id: `${listing_id}:${kind}:${key}`, listing_id, kind, key, value });
  const listing_criteria = [
    crit(ID.ems, "required", "trial_done", true), crit(ID.ems, "bonus", "languages", ["de"]), crit(ID.ems, "bonus", "volunteering", true),
    crit(ID.pharma, "required", "min_average", 4.5), crit(ID.pharma, "bonus", "aptitude_test", true),
    crit(ID.garageKv, "required", "languages", ["de"]), crit(ID.garageKv, "bonus", "languages", ["fr"]),
    crit(ID.garageLog, "bonus", "moped_license", true),
    crit(ID.simplon, "required", "trial_done", true), crit(ID.simplon, "bonus", "moped_license", true),
  ];

  const birth = new Date(now - (16 * 365 + 90) * day).toISOString().slice(0, 10);
  const students = [{
    profile_id: LEA_ID, first_name: "Léa", birth_date: birth, commune: "Sion", commune_id: communeId("sion"), school_year: "11",
    grades: { average: 5.1 }, aptitude_tests: [{ name: "Multicheck Santé", score: 78 }],
    trial_internships: [{ professionCode: "assc", company: "Hôpital du Valais", year: 2026 }],
    languages: ["fr", "de"], interests: ["sport", "musique"], soft_skills: ["punctual", "friendly", "team_player"],
    has_moped_license: false, does_volunteering: false, target_professions: ["assc"], share_trial_feedback: false,
    share_checkups_with_guardians: false, checkup_frequency_days: 14, plan: "free", created_at: iso(now - 20 * day),
  }];

  const appointment = {
    id: ID.apptEms, application_id: ID.appEms, kind: "interview", status: "proposed", location: "Rue des Tilleuls 12, 1950 Sion",
    contact_person: "Claire Fournier", what_to_bring: "Tes deux derniers bulletins", duration_minutes: 45, chosen_slot_id: null,
    created_at: iso(now - day),
  };
  const params = { application_id: ID.appEms, company: "EMS Les Tilleuls", listing: listings[0]!.title, first_name: "Léa", appointment_kind: "interview" };

  return {
    profiles: [{ id: LEA_ID, role: "student", locale: "fr" }],
    students,
    communes,
    professions,
    listings,
    listing_criteria,
    applications: [{
      id: ID.appEms, student_id: LEA_ID, listing_id: ID.ems, status: "interview", created_at: iso(now - 3 * day), updated_at: iso(now - day),
      cover_letter: "Bonjour, j'ai fait mon stage d'essai à l'Hôpital du Valais et j'ai adoré le contact avec les patients. Prendre soin des autres, c'est ce qui me motive. Je suis ponctuelle, souriante et j'aime travailler en équipe.",
      cv_document_id: null,
    }],
    appointments: [appointment],
    appointment_slots: [
      { id: ID.slot1, appointment_id: ID.apptEms, starts_at: slotAt(3, 14) },
      { id: ID.slot2, appointment_id: ID.apptEms, starts_at: slotAt(4, 9, 30) },
    ],
    messages: [{
      id: ID.msg1, application_id: ID.appEms, sender_role: "company", kind: "invitation", appointment_id: ID.apptEms, created_at: iso(now - day),
      body: "Bonjour Léa,\n\nMerci pour ta candidature chez EMS Les Tilleuls ! Nous aimerions faire ta connaissance lors d'un entretien. Pas de stress : c'est surtout l'occasion de discuter et de répondre à tes questions.\n\nChoisis le créneau qui te convient le mieux directement dans l'app.\n\nÀ bientôt !\nClaire Fournier",
    }],
    notifications: [
      { id: ID.notif1, profile_id: LEA_ID, type: "invitation", params, read_at: null, created_at: iso(now - day) },
      { id: ID.notif2, profile_id: LEA_ID, type: "checkup_ready", params: { report_id: ID.report1 }, read_at: null, created_at: iso(now - 2 * day) },
    ],
    checkup_reports: [{
      id: ID.report1, student_id: LEA_ID, period_start: iso(now - 16 * day), period_end: iso(now - 2 * day), read_at: null, created_at: iso(now - 2 * day),
      content: {
        version: 1,
        stats: { applications: 1, active: 1, follow_ups: 0, invitations: 1, offers: 0, not_this_time: 0 },
        working: [{ key: "invitations", count: 1 }, { key: "applied", count: 1 }],
        blocking: [],
        suggestions: [],
        actions: [{ key: "add_cv" }, { key: "apply_more", count: 2 }, { key: "prepare_appointment", company: "EMS Les Tilleuls", appointment_kind: "interview", starts_at: slotAt(3, 14) }],
      },
    }],
    student_documents: [],
    guardians_access: [],
    trial_evaluations: [],
    push_tokens: [],
  };
}

export const communeById = (t: Tables, id: string | null | undefined) => t.communes!.find((c) => c.id === id);
