/**
 * Host QR encodes a URL like /session/{CODE}/player. Accept that or a raw code string.
 */
export function parseSessionCodeFromQrOrText(text: string): string | null {
  const raw = text.trim();
  if (!raw) return null;

  try {
    const u = new URL(raw);
    const m = u.pathname.match(/\/session\/([A-Za-z0-9]+)\/player\/?$/i);
    if (m) return m[1].toUpperCase();
  } catch {
    const rel = raw.match(/\/session\/([A-Za-z0-9]+)\/player\/?$/i);
    if (rel) return rel[1].toUpperCase();
  }

  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.length >= 4 && compact.length <= 32) return compact;
  return null;
}
