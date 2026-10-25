// Configuration Metro. En mode démo (KICKOFF_DEMO=1), le client Supabase est remplacé par un faux backend en mémoire.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

if (process.env.KICKOFF_DEMO === "1") {
  const real = path.resolve(__dirname, "src/lib/supabase.ts");
  const demo = path.resolve(__dirname, "src/lib/supabase.demo.ts");
  const upstream = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const result = (upstream ?? context.resolveRequest)(context, moduleName, platform);
    return result.type === "sourceFile" && result.filePath === real ? { ...result, filePath: demo } : result;
  };
}

module.exports = config;
