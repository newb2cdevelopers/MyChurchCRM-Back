export const MODULE_FUNCTIONALITY_ORDER: Record<string, string[]> = {
  community: ['/members'],
  users: ['/manage-users', '/front-assignment'],
  'family-groups': ['/family-groups'],
  aforo: [
    '/create-events',
    '/verify-asistents',
    '/confirmarReserva',
    '/cargaMasiva',
  ],
  'sunday-school': [
    '/sunday-school-students',
    '/sunday-school-levels',
    '/sunday-school-classes',
  ],
};
