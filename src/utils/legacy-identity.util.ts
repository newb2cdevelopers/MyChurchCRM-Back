/**
 * Transitional helpers that expose the canonical Person data using the legacy
 * flat field names expected by current clients.
 *
 * The profile collections (members, students) no longer own identity data.
 * During the expand -> migrate -> contract transition, providers populate
 * personId and these helpers project the person fields back into the response
 * shape. Remove them once the frontend consumes `person` directly.
 */

export interface PersonSnapshot {
  _id?: unknown;
  firstName?: string;
  secondName?: string;
  firstLastName?: string;
  secondLastName?: string;
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  birthDate?: Date;
  email?: string;
  mobilePhone?: string;
  landLine?: string;
  address?: string;
  housingType?: string;
  maritalStatus?: string;
  educationalLevel?: string;
  occupation?: string;
}

export interface LegacyMemberFields {
  person?: PersonSnapshot;
  fullName: string;
  documentType: string;
  documentNumber: string;
  birthDate?: Date;
  email?: string;
  mobilePhone?: string;
  landLine?: string;
  address?: string;
  housingType?: string;
  maritalStatus?: string;
  educationalLevel?: string;
  occupation?: string;
}

export interface LegacyStudentFields {
  person?: PersonSnapshot;
  name: string;
  lastName: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  birthDate?: Date;
}

export function getPersonSnapshot(
  doc: { personId?: unknown } | null | undefined,
): PersonSnapshot | null {
  if (!doc) return null;

  const person = doc.personId;

  if (!person || typeof person !== 'object') return null;

  return person as PersonSnapshot;
}

export function withLegacyMemberFields<T extends { personId?: unknown }>(
  doc: T,
): T & LegacyMemberFields {
  const person = getPersonSnapshot(doc);

  return {
    ...doc,
    person: person || undefined,
    fullName: person?.fullName || '',
    documentType: person?.documentType || '',
    documentNumber: person?.documentNumber || '',
    birthDate: person?.birthDate,
    email: person?.email,
    mobilePhone: person?.mobilePhone,
    landLine: person?.landLine,
    address: person?.address,
    housingType: person?.housingType,
    maritalStatus: person?.maritalStatus,
    educationalLevel: person?.educationalLevel,
    occupation: person?.occupation,
  };
}

export function withLegacyStudentFields<T extends { personId?: unknown }>(
  doc: T,
): T & LegacyStudentFields {
  const person = getPersonSnapshot(doc);

  return {
    ...doc,
    person: person || undefined,
    name: person?.firstName || '',
    lastName: person?.firstLastName || '',
    fullName: person?.fullName || '',
    documentType: person?.documentType || '',
    documentNumber: person?.documentNumber || '',
    birthDate: person?.birthDate,
  };
}

/**
 * Splits a single full-name string into the canonical person name fields.
 * The first token is used as firstName and the remainder as firstLastName.
 */
export function splitFullName(fullName: string): {
  firstName: string;
  firstLastName?: string;
} {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    firstLastName: parts.slice(1).join(' ') || undefined,
  };
}
