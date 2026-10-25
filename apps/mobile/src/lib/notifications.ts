import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
});

/**
 * Enregistre l'appareil pour les notifications push (Expo, gratuit).
 * Nécessite un identifiant de projet EAS (compte Expo gratuit) : sans lui, on reste en notifications in-app.
 */
export async function registerForPush(profileId: string) {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!Device.isDevice || !projectId) return;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "Kickoff", importance: Notifications.AndroidImportance.HIGH });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from("push_tokens").upsert(
      { profile_id: profileId, token, platform: Platform.OS === "ios" ? "ios" : "android" },
      { onConflict: "token", ignoreDuplicates: true },
    );
  } catch {
    // Les notifications in-app restent disponibles.
  }
}

/** Nombre de notifications non lues, mis à jour en temps réel. */
export function useUnreadCount(profileId: string | undefined) {
  const [count, setCount] = useState(0);
  const load = useCallback(async () => {
    const { count: c } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    setCount(c ?? 0);
  }, []);
  useEffect(() => {
    if (!profileId) return;
    void load();
    const channel = supabase
      .channel(`notifications-${profileId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `profile_id=eq.${profileId}` }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profileId, load]);
  return { count, reload: load };
}
