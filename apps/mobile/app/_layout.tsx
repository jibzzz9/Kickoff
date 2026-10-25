import "../src/i18n";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "../src/auth/AuthProvider";
import { registerForPush } from "../src/lib/notifications";

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
    if (session) void registerForPush(session.user.id);
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
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Guard />
    </AuthProvider>
  );
}
