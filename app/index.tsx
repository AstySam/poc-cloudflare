import { useSession } from "@/utils/auth-client";
import { Redirect } from "expo-router";

export default function Index() {
  const { data: session, isPending } = useSession();

  // While session is loading, render nothing to avoid flicker
  if (isPending) return null;

  if (session) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}
