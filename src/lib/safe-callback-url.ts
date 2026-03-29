/** Evita open redirects: solo rutas relativas internas. */
export function safeCallbackUrl(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string" || v.length === 0) return "/dashboard";
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return "/dashboard";
  return v;
}
