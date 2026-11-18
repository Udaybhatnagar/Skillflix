export function normalizeWebOrigin(value: string): string {
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
    throw new Error('WEB_ORIGIN must be an HTTP or HTTPS website URL without credentials');
  return url.origin;
}

export const webOrigin = normalizeWebOrigin(process.env.WEB_ORIGIN || 'http://localhost:5173');
