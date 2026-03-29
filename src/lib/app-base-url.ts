/** URL base pública de la app (enlaces en emails, SMS). Sin barra final. */
export function getAppBaseUrl(): string {
  const auth = process.env.AUTH_URL?.trim();
  if (auth) return auth.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (pub) return pub.replace(/\/$/, "");
  return "http://localhost:3000";
}
