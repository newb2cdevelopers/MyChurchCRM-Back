export function normalizeDocument(documentNumber: string): string {
  if (!documentNumber) return '';

  return documentNumber
    .toString()
    .trim()
    .replace(/[\.\-\s,]/g, '')
    .toUpperCase();
}

export function normalizeEmail(email: string): string {
  if (!email) return '';

  return email.toString().trim().toLowerCase();
}
