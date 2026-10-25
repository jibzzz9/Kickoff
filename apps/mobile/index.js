// Point d'entrée de l'app. En version démo (aperçu web autonome), la page peut être servie sous n'importe quel
// chemin : on démarre toujours sur « / », avant que le routeur ne lise l'adresse.
if (process.env.EXPO_PUBLIC_DEMO === "1" && typeof window !== "undefined") {
  window.history.replaceState(null, "", "/");
}
require("expo-router/entry");
