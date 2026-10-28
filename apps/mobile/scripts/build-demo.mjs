// Construit l'aperçu en ligne de l'app élève : une seule page HTML autonome (mode démo, données fictives).
// Usage : node scripts/build-demo.mjs <dossier de sortie>
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const out = resolve(process.argv[2] ?? "dist-demo");
const exportDir = join(out, "export");
mkdirSync(out, { recursive: true });

const build = spawnSync("npx", ["expo", "export", "--platform", "web", "--output-dir", exportDir, "--clear"], {
  stdio: "inherit",
  env: { ...process.env, KICKOFF_DEMO: "1", EXPO_PUBLIC_DEMO: "1" },
});
if (build.status !== 0) process.exit(build.status ?? 1);

const html = readFileSync(join(exportDir, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)].map((m) => m[1]);
if (!scripts.length) throw new Error("aucun script trouvé dans index.html");

// Images et polices réellement utilisées (icônes, Archivo) : intégrées en data: URI (une page publiée ne charge aucun fichier externe).
const MIME = { png: "image/png", ttf: "font/ttf" };
const keep = (path) =>
  path.includes("/expo-router/assets/") || path.includes("/Fonts/Ionicons.") || path.includes("/@expo-google-fonts/archivo/");
const inlineAssets = (js) =>
  js.replace(/"(\/assets\/[^"]+\.(png|ttf))"/g, (all, path, ext) =>
    keep(path) ? JSON.stringify(`data:${MIME[ext]};base64,${readFileSync(join(exportDir, path)).toString("base64")}`) : all,
  );

const code = scripts.map((src) => inlineAssets(readFileSync(join(exportDir, src), "utf8")).replace(/<\/script/gi, "<\\/script"));

const page = `<title>App élève Kickoff</title>
<meta name="theme-color" content="#13212B">
<style>
  /* La page occupe exactement l'écran, marges de sécurité des téléphones comprises. */
  html { height: 100%; box-sizing: border-box; background: #13212B; }
  body { height: 100%; margin: 0; background: #13212B; overflow: hidden; }
  #root { display: flex; flex-direction: column; height: 100%; width: 100%; background: #FFFFFF; }
  /* Sur un grand écran, l'app s'affiche dans un cadre de téléphone, sur un fond de ciel nocturne. */
  @media (min-width: 640px) and (min-height: 700px) {
    body { display: flex; align-items: center; justify-content: center; background: radial-gradient(120% 90% at 50% 110%, #1D6E8C 0%, #13212B 60%); }
    #root { width: 390px; height: min(844px, calc(100% - 48px)); border: 10px solid #0B151C; border-radius: 48px; overflow: hidden; box-shadow: 0 40px 90px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06); }
  }
</style>
<div id="root"></div>
${code.map((c) => `<script>${c}</script>`).join("\n")}
`;

const file = join(out, "kickoff-app-eleve.html");
writeFileSync(file, page);
console.log(`Aperçu créé : ${file} (${Math.round(page.length / 1024)} Ko)`);
