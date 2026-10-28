import "../src/i18n";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";
// Import graisse par graisse : seules les 6 polices utilisées sont embarquées dans l'app.
import { Archivo_400Regular } from "@expo-google-fonts/archivo/400Regular";
import { Archivo_500Medium } from "@expo-google-fonts/archivo/500Medium";
import { Archivo_600SemiBold } from "@expo-google-fonts/archivo/600SemiBold";
import { Archivo_700Bold } from "@expo-google-fonts/archivo/700Bold";
import { Archivo_800ExtraBold } from "@expo-google-fonts/archivo/800ExtraBold";
import { Archivo_900Black } from "@expo-google-fonts/archivo/900Black";
import { AuthProvider, useAuth } from "../src/auth/AuthProvider";
import { registerForPush } from "../src/lib/notifications";
import { DemoBanner } from "../src/ui/DemoBanner";
import { supabase } from "../src/lib/supabase";
import i18n from "../src/i18n";

function Guard() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!session && !inAuth) router.replace("/login");
    if (session && inAuth) router.replace("/");
  }, [session, loading, segments, router]);

  useEffect(() => {
    if (!session) return;
    void registerForPush(session.user.id);
    // La langue choisie dans le profil l'emporte sur celle de l'appareil.
    void supabase.from("profiles").select("locale").eq("id", session.user.id).single().then(({ data }) => {
      if (data?.locale && data.locale !== i18n.language) void i18n.changeLanguage(data.locale);
    });
  }, [session]);

  // Toucher une notification push ouvre la candidature concernée.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const data = r.notification.request.content.data as { type?: string; params?: { application_id?: string } };
      if (data?.type === "checkup_ready") router.push("/coach");
      else if (data?.params?.application_id) router.push(`/application/${data.params.application_id}`);
    });
    return () => sub.remove();
  }, [router]);

  return <Slot />;
}

export default function RootLayout() {
  // Typographie Archivo (fichiers inclus dans l'app, aucun appel réseau). En cas d'échec, police système.
  const [fontsLoaded, fontError] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      {process.env.EXPO_PUBLIC_DEMO === "1" && <DemoBanner />}
      <Guard />
    </AuthProvider>
  );
}
