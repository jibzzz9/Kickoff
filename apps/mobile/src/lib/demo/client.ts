/**
 * Faux backend du mode démo : imite la petite partie de supabase-js utilisée par l'app, en mémoire.
 * Le calcul de compatibilité est le vrai (moteur partagé). Les réponses de l'entreprise sont simulées
 * quelques secondes après les actions de l'élève, pour montrer le parcours en direct.
 * Rien n'est envoyé ni enregistré : tout repart à zéro au rechargement de la page.
 */
import { computeMatch, messageTemplate, toScoringProfile, type Lang, type ScoringCriterion, type Weights } from "@kickoff/shared";
import { communeById, communeId, createDemoData, ID, LEA_ID, slotAt, TRANSIT_FROM_SION, type Row, type Tables } from "./data";

type Result = { data: unknown; error: { message: string } | null; count?: number | null };
type Change = { eventType: string; new: Row; old: Row };
type Listener = { table: string; cb: (c: Change) => void };
type Session = { user: { id: string; email: string } };

const COMPANY_DELAY_MS = 6000;
const OWNER: Record<string, string> = {
  profiles: "id", students: "profile_id", applications: "student_id", notifications: "profile_id",
  checkup_reports: "student_id", student_documents: "student_id", guardians_access: "student_id", push_tokens: "profile_id",
};

export function createDemoClient() {
  let db: Tables = createDemoData();
  let session: Session | null = null;
  let seq = 0;
  const authListeners = new Set<(event: string, s: Session | null) => void>();
  const listeners = new Set<Listener>();

  // UUID v4 (format exigé par les schémas de l'app).
  const newId = () => {
    const r = globalThis.crypto as { randomUUID?: () => string } | undefined;
    if (r?.randomUUID) return r.randomUUID();
    const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${(seq++).toString(16).padStart(4, "0")}${hex(8)}`;
  };
  const now = () => new Date().toISOString();
  const uid = () => session?.user.id ?? "";
  const emit = (table: string, eventType: string, row: Row) =>
    listeners.forEach((l) => l.table === table && l.cb({ eventType, new: row, old: {} }));
  const student = () => db.students!.find((s) => s.profile_id === uid());
  const lang = (): Lang => (db.profiles!.find((p) => p.id === uid())?.locale === "de" ? "de" : "fr");

  // ---------- Vues et périmètre (ce que la RLS renverrait) ----------
  function listingCards(): Row[] {
    const applied = new Set(db.applications!.filter((a) => a.student_id === uid()).map((a) => a.listing_id));
    return db.listings!.filter((l) => l.status === "open" || applied.has(l.id)).map((l) => {
      const p = db.professions!.find((x) => x.id === l.profession_id)!;
      const c = communeById(db, l.commune_id)!;
      return { ...l, profession_code: p.code, profession_name_fr: p.name_fr, profession_name_de: p.name_de, commune_name: c.name, lat: c.lat, lng: c.lng };
    });
  }
  function rows(table: string): Row[] {
    if (table === "listing_cards") return listingCards();
    const all = db[table] ?? [];
    const owner = OWNER[table];
    return owner ? all.filter((r) => r[owner] === uid()) : all;
  }

  function insertRow(table: string, row: Row): Row {
    const full = { id: newId(), created_at: now(), ...row };
    (db[table] ??= []).push(full);
    emit(table, "INSERT", full);
    return full;
  }
  function updateRows(table: string, match: (r: Row) => boolean, patch: Row) {
    for (const r of db[table] ?? []) if (match(r)) { Object.assign(r, patch); emit(table, "UPDATE", r); }
  }
  const notify = (type: string, params: Row) => insertRow("notifications", { profile_id: uid(), type, params, read_at: null });
  const post = (application_id: string, sender_role: string, kind: string, body: string | null, appointment_id: string | null = null) =>
    insertRow("messages", { application_id, sender_role, kind, body, appointment_id });

  function ctx(appId: string) {
    const app = db.applications!.find((a) => a.id === appId)!;
    const listing = db.listings!.find((l) => l.id === app.listing_id)!;
    return { app, listing, params: { application_id: appId, company: listing.company_name, listing: listing.title, first_name: student()?.first_name ?? "" } };
  }

  // ---------- L'entreprise répond (simulation) ----------
  function companyInvites(appId: string) {
    const { app, listing, params } = ctx(appId);
    if (["withdrawn", "accepted", "declined"].includes(app.status)) return;
    const kind = listing.profession_id === ID.profLog ? "trial" : "interview";
    const appt = insertRow("appointments", {
      application_id: appId, kind, status: "proposed", location: `${listing.company_name}, ${communeById(db, listing.commune_id)?.name}`,
      contact_person: listing.contact_name, what_to_bring: kind === "trial" ? "Des chaussures fermées" : "Tes derniers bulletins",
      duration_minutes: kind === "trial" ? 480 : 45, chosen_slot_id: null,
    });
    insertRow("appointment_slots", { appointment_id: appt.id, starts_at: slotAt(5, 8) });
    insertRow("appointment_slots", { appointment_id: appt.id, starts_at: slotAt(6, 13, 30) });
    updateRows("applications", (a) => a.id === appId, { status: kind, updated_at: now() });
    post(appId, "company", "invitation", messageTemplate(lang(), kind === "trial" ? "invitation_trial" : "invitation_interview",
      { firstName: params.first_name, company: listing.company_name, sender: listing.contact_name }), appt.id);
    notify("invitation", { ...params, appointment_kind: kind });
  }
  function companyOffers(appId: string) {
    const { app, listing, params } = ctx(appId);
    if (["withdrawn", "accepted", "declined", "offer"].includes(app.status)) return;
    updateRows("applications", (a) => a.id === appId, { status: "offer", updated_at: now() });
    post(appId, "company", "offer", messageTemplate(lang(), "offer", { firstName: params.first_name, company: listing.company_name, listing: listing.title, sender: listing.contact_name }));
    notify("offer", params);
  }
  function companyReplies(appId: string) {
    const { listing, params } = ctx(appId);
    post(appId, "company", "text", lang() === "de" ? `Danke ${params.first_name}, gut erhalten! Bis bald.\n${listing.contact_name}` : `Merci ${params.first_name}, bien reçu ! À bientôt.\n${listing.contact_name}`);
    notify("new_message", params);
  }
  const later = (fn: () => void) => setTimeout(fn, COMPANY_DELAY_MS);

  // ---------- Constructeur de requêtes ----------
  class Query implements PromiseLike<Result> {
    private filters: ((r: Row) => boolean)[] = [];
    private sort?: { col: string; asc: boolean };
    private max?: number;
    private one: "single" | "maybe" | null = null;
    private head = false;
    private columns = "*";
    private returning = false;
    constructor(private table: string, private op: "select" | "insert" | "update" | "upsert" | "delete" = "select", private payload?: Row | Row[]) {}

    select(columns = "*", opts?: { count?: string; head?: boolean }) {
      if (this.op !== "select") this.returning = true;
      this.columns = columns;
      this.head = Boolean(opts?.head);
      return this;
    }
    eq(col: string, v: unknown) { this.filters.push((r) => r[col] === v); return this; }
    neq(col: string, v: unknown) { this.filters.push((r) => r[col] !== v); return this; }
    in(col: string, vs: unknown[]) { this.filters.push((r) => vs.includes(r[col])); return this; }
    is(col: string, v: unknown) { this.filters.push((r) => (v === null ? r[col] == null : r[col] === v)); return this; }
    order(col: string, opts?: { ascending?: boolean }) { this.sort = { col, asc: opts?.ascending !== false }; return this; }
    limit(n: number) { this.max = n; return this; }
    single() { this.one = "single"; return this; }
    maybeSingle() { this.one = "maybe"; return this; }

    then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, ko?: ((e: unknown) => B | PromiseLike<B>) | null) {
      return Promise.resolve()
        .then((): Result => {
          try {
            return this.run();
          } catch (e) {
            return { data: null, error: { message: e instanceof Error ? e.message : "demo_error" } };
          }
        })
        .then(ok, ko);
    }

    private matches = (r: Row) => this.filters.every((f) => f(r));

    private run(): Result {
      if (this.op === "insert" || this.op === "upsert") {
        const list = (Array.isArray(this.payload) ? this.payload : [this.payload ?? {}]).map((row) => this.insertOne(row));
        return this.shape(list);
      }
      if (this.op === "update") {
        const ids = rows(this.table).filter(this.matches).map((r) => r.id ?? r.profile_id);
        updateRows(this.table, (r) => ids.includes(r.id ?? r.profile_id), this.payload as Row);
        return { data: null, error: null };
      }
      if (this.op === "delete") {
        db[this.table] = (db[this.table] ?? []).filter((r) => !this.matches(r));
        return { data: null, error: null };
      }
      let list = rows(this.table).filter(this.matches);
      if (this.sort) {
        const { col, asc } = this.sort;
        list = [...list].sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (asc ? 1 : -1));
      }
      if (this.max !== undefined) list = list.slice(0, this.max);
      if (this.head) return { data: null, error: null, count: list.length };
      if (this.table === "appointments" && this.columns.includes("appointment_slots")) {
        list = list.map((a) => ({ ...a, appointment_slots: db.appointment_slots!.filter((s) => s.appointment_id === a.id) }));
      }
      return this.shape(list.map((r) => ({ ...r })));
    }

    private shape(list: Row[]): Result {
      if (this.op !== "select" && !this.returning) return { data: null, error: null };
      if (this.one === "single") return list[0] ? { data: list[0], error: null } : { data: null, error: { message: "no rows" } };
      if (this.one === "maybe") return { data: list[0] ?? null, error: null };
      return { data: list, error: null };
    }

    private insertOne(row: Row): Row {
      if (this.table === "push_tokens") return row;
      if (this.table === "applications") {
        if (db.applications!.some((a) => a.student_id === row.student_id && a.listing_id === row.listing_id)) throw new Error("duplicate");
        const app = insertRow("applications", { status: "sent", updated_at: now(), ...row });
        later(() => companyInvites(app.id));
        return app;
      }
      if (this.table === "messages") {
        const m = insertRow("messages", { kind: "text", appointment_id: null, ...row });
        if (m.sender_role === "student") later(() => companyReplies(m.application_id));
        return m;
      }
      return insertRow(this.table, row);
    }
  }

  // ---------- Fonctions serveur (RPC) ----------
  function suggestions(limit: number) {
    const me = student();
    const home = communeById(db, me?.commune_id);
    const tried = new Set(db.applications!.filter((a) => a.student_id === uid())
      .map((a) => db.professions!.find((p) => p.id === db.listings!.find((l) => l.id === a.listing_id)?.profession_id)?.code));
    const applied = new Set(db.applications!.filter((a) => a.student_id === uid()).map((a) => a.listing_id));
    const km = (c?: Row) => (home && c ? Math.round(111 * Math.hypot(c.lat - home.lat, (c.lng - home.lng) * 0.69)) : null);
    return listingCards().filter((l) => l.status === "open" && !applied.has(l.id))
      .map((l) => {
        const reason = me?.target_professions.includes(l.profession_code) ? "target_profession" : tried.has(l.profession_code) ? "same_profession" : "nearby";
        return { listing_id: l.id, reason, distance_km: km(communeById(db, l.commune_id)) };
      })
      .sort((a, b) => ["target_profession", "same_profession", "nearby"].indexOf(a.reason) - ["target_profession", "same_profession", "nearby"].indexOf(b.reason)
        || (a.distance_km ?? 0) - (b.distance_km ?? 0))
      .slice(0, limit);
  }

  async function rpc(name: string, args: Row = {}): Promise<Result> {
    switch (name) {
      case "record_listing_view":
        return { data: null, error: null };
      case "suggest_listings":
        return { data: suggestions(args.p_limit ?? 5), error: null };
      case "request_checkup": {
        const last = rows("checkup_reports").sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
        return { data: last?.id ?? null, error: null };
      }
      case "student_choose_slot": {
        updateRows("appointments", (a) => a.id === args.p_appointment, { chosen_slot_id: args.p_slot, status: "scheduled" });
        const appt = db.appointments!.find((a) => a.id === args.p_appointment)!;
        post(appt.application_id, "student", "slot_chosen", null, appt.id);
        later(() => companyOffers(appt.application_id));
        return { data: null, error: null };
      }
      case "student_respond_offer": {
        const accept = Boolean(args.p_accept);
        updateRows("applications", (a) => a.id === args.p_application, { status: accept ? "accepted" : "declined", updated_at: now() });
        post(args.p_application, "student", accept ? "offer_accepted" : "offer_declined", null);
        return { data: null, error: null };
      }
      case "student_follow_up":
        updateRows("applications", (a) => a.id === args.p_application, { status: "followed_up", updated_at: now() });
        post(args.p_application, "student", "follow_up", args.p_message ?? null);
        return { data: null, error: null };
      case "student_withdraw":
        updateRows("applications", (a) => a.id === args.p_application, { status: "withdrawn", updated_at: now() });
        updateRows("appointments", (a) => a.application_id === args.p_application && ["proposed", "scheduled"].includes(a.status), { status: "cancelled" });
        post(args.p_application, "student", "withdrawn", null);
        return { data: null, error: null };
      default:
        return { data: null, error: { message: `demo: ${name}` } };
    }
  }

  // ---------- Edge Functions ----------
  async function invoke(name: string, opts: { body?: Row } = {}): Promise<Result> {
    const body = opts.body ?? {};
    const me = student();
    if (name === "match" && body.action === "compat" && me) {
      const results: Row = {};
      const hasCv = rows("student_documents").some((d) => d.kind === "cv");
      for (const l of listingCards().filter((x) => (body.listingIds as string[]).includes(x.id))) {
        const letter = db.applications!.find((a) => a.student_id === uid() && a.listing_id === l.id)?.cover_letter ?? null;
        const criteria = db.listing_criteria!.filter((c) => c.listing_id === l.id) as ScoringCriterion[];
        const r = computeMatch(toScoringProfile(me, { hasCv, coverLetter: letter }), { professionCode: l.profession_code, weights: l.weights as Weights, criteria });
        results[l.id] = { score: r.score, criteria: r.criteria, strengths: r.strengths, improvements: r.improvements, missingInfo: r.missingInfo, algoVersion: r.algoVersion };
      }
      return { data: { results }, error: null };
    }
    if (name === "transit" && me) {
      const listing = listingCards().find((l) => l.id === body.listingId);
      if (!listing) return { data: { minutes: null }, error: null };
      if (listing.commune_id === me.commune_id) return { data: { minutes: 0, sameCommune: true }, error: null };
      const code = communeById(db, listing.commune_id)?.code ?? "";
      const known = me.commune_id === communeId("sion") ? TRANSIT_FROM_SION[code] : undefined;
      return { data: { minutes: known ?? null, transfers: 0 }, error: null };
    }
    if (name === "guardian" && body.action === "invite") {
      insertRow("guardians_access", { student_id: uid(), guardian_email: String(body.email), relation: body.relation === "teacher" ? "teacher" : "parent", accepted_at: null, revoked_at: null });
      return { data: { invited: true }, error: null };
    }
    if (name === "account" && body.action === "export") {
      const mine = Object.fromEntries(Object.keys(OWNER).map((t) => [t, rows(t)]));
      return { data: { exported_at: now(), demo: true, ...mine }, error: null };
    }
    if (name === "account" && body.action === "delete") {
      db = createDemoData();
      return { data: { deleted: true }, error: null };
    }
    return { data: null, error: { message: `demo: ${name}` } };
  }

  // ---------- Authentification ----------
  const setSession = (s: Session | null, event: string) => {
    session = s;
    authListeners.forEach((cb) => cb(event, s));
  };

  return {
    from: (table: string) => ({
      select: (columns?: string, opts?: { count?: string; head?: boolean }) => new Query(table).select(columns, opts),
      insert: (payload: Row | Row[]) => new Query(table, "insert", payload),
      upsert: (payload: Row | Row[]) => new Query(table, "upsert", payload),
      update: (payload: Row) => new Query(table, "update", payload),
      delete: () => new Query(table, "delete"),
    }),
    rpc,
    functions: { invoke },
    storage: {
      from: () => ({
        upload: async (path: string) => ({ data: { path }, error: null }),
        createSignedUrl: async () => ({ data: null, error: { message: "demo" } }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
    channel: () => {
      const subs: Listener[] = [];
      const ch = {
        on: (type: string, filter: { table?: string }, cb: (c: Change) => void) => {
          if (type === "postgres_changes" && filter.table) subs.push({ table: filter.table, cb });
          return ch;
        },
        subscribe: () => { subs.forEach((s) => listeners.add(s)); return ch; },
        unsubscribe: () => subs.forEach((s) => listeners.delete(s)),
      };
      return ch;
    },
    removeChannel: async (ch: { unsubscribe: () => void }) => { ch.unsubscribe(); return "ok"; },
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user: session?.user ?? null }, error: null }),
      onAuthStateChange: (cb: (event: string, s: Session | null) => void) => {
        authListeners.add(cb);
        return { data: { subscription: { unsubscribe: () => authListeners.delete(cb) } } };
      },
      // Mode démo : n'importe quel email et mot de passe ouvrent le compte de Léa.
      signInWithPassword: async ({ email }: { email: string }) => {
        const known = db.profiles!.find((p) => p.email === email);
        setSession({ user: { id: known?.id ?? LEA_ID, email } }, "SIGNED_IN");
        return { data: { session }, error: null };
      },
      signUp: async ({ email, options }: { email: string; options?: { data?: Row } }) => {
        const meta = options?.data ?? {};
        const id = newId();
        db.profiles!.push({ id, email, role: "student", locale: meta.locale === "de" ? "de" : "fr" });
        db.students!.push({
          profile_id: id, first_name: meta.first_name, birth_date: meta.birth_date, commune: meta.commune,
          commune_id: db.communes!.find((c) => c.name.toLowerCase() === String(meta.commune ?? "").toLowerCase())?.id ?? null,
          school_year: null, grades: {}, aptitude_tests: [], trial_internships: [], languages: [], interests: [], soft_skills: [],
          has_moped_license: false, does_volunteering: false, target_professions: [], share_trial_feedback: false,
          share_checkups_with_guardians: false, checkup_frequency_days: 14, plan: "free", created_at: now(),
        });
        setSession({ user: { id, email } }, "SIGNED_IN");
        return { data: { session }, error: null };
      },
      signOut: async () => { setSession(null, "SIGNED_OUT"); return { error: null }; },
    },
  };
}
