/**
 * Clave pública VAPID en servidor.
 * Preferí VAPID_PUBLIC_KEY; NEXT_PUBLIC_VAPID_PUBLIC_KEY se acepta por compatibilidad con despliegues que solo definieron la variable pública con prefijo NEXT_PUBLIC_.
 */
export function getVapidPublicKey(): string | undefined {
  const primary = process.env.VAPID_PUBLIC_KEY?.trim();
  if (primary) return primary;
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
}

export function isVapidConfiguredForSubscribe(): boolean {
  return Boolean(getVapidPublicKey() && process.env.VAPID_PRIVATE_KEY?.trim());
}
