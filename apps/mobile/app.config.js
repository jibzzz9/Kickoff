// En mode démo (aperçu web autonome), tout le code est regroupé en un seul fichier pour tenir dans une page.
module.exports = ({ config }) => {
  if (process.env.KICKOFF_DEMO !== "1") return config;
  return {
    ...config,
    plugins: config.plugins.map((p) => (p === "expo-router" ? ["expo-router", { asyncRoutes: false }] : p)),
    web: { ...(config.web ?? {}), output: "single" },
  };
};
