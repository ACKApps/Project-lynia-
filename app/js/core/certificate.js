// Certificate of authenticity for each hand. The fingerprint binds the art piece to its
// edition, number, cause and date; in production the platform signs it with the edition's
// key (and can anchor it publicly), so a shared image can always be checked against the ledger.

export function canonicalPayload({ edition, handNo, causeId, date, city, artDigest }) {
  return JSON.stringify({ edition, handNo, causeId, date, city, artDigest });
}

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Fingerprint shown on the art piece, e.g. "LV01-0143-9F2C-71AB". */
export async function certificateCode(fields) {
  const hex = await sha256Hex(canonicalPayload(fields));
  const no = String(fields.handNo).padStart(4, '0');
  return `${fields.edition}-${no}-${hex.slice(0, 4)}-${hex.slice(4, 8)}`.toUpperCase();
}
