import { Alert, Platform } from "react-native";

// Fonctions du navigateur, présentes seulement dans l'aperçu web.
const browser = globalThis as unknown as { confirm: (m: string) => boolean; alert: (m: string) => void };

/** Demande de confirmation qui fonctionne aussi dans l'aperçu web (où Alert ne gère pas les boutons). */
export function confirmAsync(title: string, message: string | undefined, labels: { cancel: string; ok: string }): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(browser.confirm(message ? `${title}\n\n${message}` : title));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: labels.cancel, style: "cancel", onPress: () => resolve(false) },
      { text: labels.ok, style: "destructive", onPress: () => resolve(true) },
    ]),
  );
}

export function notify(message: string) {
  if (Platform.OS === "web") browser.alert(message);
  else Alert.alert(message);
}
