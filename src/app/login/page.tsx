import { LoginForm } from "./login-form";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl);

  return <LoginForm callbackUrl={callbackUrl} />;
}
