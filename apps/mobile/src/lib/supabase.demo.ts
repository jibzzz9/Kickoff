// Remplace src/lib/supabase.ts dans la version démo (voir metro.config.js) : aucun appel réseau.
import { createDemoClient } from "./demo/client";

export const supabase = createDemoClient();
