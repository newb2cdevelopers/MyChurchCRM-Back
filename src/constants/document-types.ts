export const DOCUMENT_TYPES = [
  'CC',
  'CE',
  'TI',
  'RC',
  'NIT',
  'Pasaporte',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
