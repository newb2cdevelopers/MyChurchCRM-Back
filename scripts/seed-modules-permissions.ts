import { config } from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import { ACTION_NAMES } from '../src/constants/action-names';

config();

/**
 * Seed: Modules + Functionalities + Role Permissions.
 *
 * This script is the single source of truth for the RBAC structure of the
 * application. Running it against a database (local or prod) guarantees:
 *
 *   1. Every module in MODULES exists (upsert by route).
 *   2. Every functionality in FUNCTIONALITIES exists (upsert by route),
 *      linked to its module.
 *   3. Every `rolepermissions` entry (role → functionality → scope + actions)
 *      in PERMISSIONS_MAP is up to date.
 *
 * To add a new module/functionality in the future:
 *   - Add the module to MODULES and its functionalities to FUNCTIONALITIES
 *     (using the module route to link them).
 *   - Add the functionality name to the `functionalityNames` array of every
 *     role that should see it, and enable/disable its actions accordingly.
 *   - Register its route in MODULE_FUNCTIONALITY_ORDER (backend) and in
 *     ROUTE_COMPONENTS (frontend) so the tab renders.
 */

const MONGO_URI = process.env.DEV_DB_CONNECTION;
const DRY_RUN = process.argv.includes('--dry-run');

interface RolePermissionEntry {
  roleName: string;
  functionalityNames: string[];
  scope: 'all' | 'own';
  actions: { name: string; enabled: boolean }[];
}

interface ModuleSeed {
  name: string;
  route: string;
  icon: string;
  active: boolean;
  description?: string;
}

interface FunctionalitySeed {
  name: string;
  route: string;
  icon: string;
  active: boolean;
  moduleRoute: string;
}

/**
 * The document persisted in the `functionalities` collection. `moduleRoute` is
 * only a seed helper used to resolve the module id, so it is not stored.
 */
function toFunctionalityDocument(seed: FunctionalitySeed) {
  const { name, route, icon, active } = seed;

  return { name, route, icon, active };
}

// All modules of the application. Keep in sync with the sidebar navigation.
const MODULES: ModuleSeed[] = [
  {
    name: 'Comunidad',
    route: 'community',
    icon: 'manage_accounts',
    active: true,
    description: 'Gestión de miembros de la iglesia',
  },
  {
    name: 'Usuarios',
    route: 'users',
    icon: 'people',
    active: true,
    description: 'Gestión de usuarios y asignación de frentes de trabajo',
  },
  {
    name: 'Grupos Familiares',
    route: 'family-groups',
    icon: 'family_restroom',
    active: true,
    description: 'Gestión de grupos familiares de la iglesia',
  },
  {
    name: 'Aforo',
    route: 'capacity',
    icon: 'groups',
    active: false,
    description:
      'Control de capacidad, registro de asistentes y gestión de eventos',
  },
  {
    name: 'Escuela Dominical',
    route: 'sunday-school',
    icon: 'school',
    active: true,
    description: 'Gestión de escuela dominical de la iglesia',
  },
  {
    name: 'Configuración',
    route: 'settings',
    icon: 'settings',
    active: true,
    description:
      'Configuración de la iglesia: servicios, frentes de trabajo y tipos de grupos familiares',
  },
];

// All functionalities of the application, linked to their module by route.
const FUNCTIONALITIES: FunctionalitySeed[] = [
  {
    name: 'Miembros',
    route: '/members',
    icon: 'person',
    active: true,
    moduleRoute: 'community',
  },
  {
    name: 'Gestionar Usuarios',
    route: '/manage-users',
    icon: 'people',
    active: true,
    moduleRoute: 'users',
  },
  {
    name: 'Asignación Frentes',
    route: '/front-assignment',
    icon: 'assignment_ind',
    active: true,
    moduleRoute: 'users',
  },
  {
    name: 'Grupos Familiares',
    route: '/family-groups',
    icon: 'family_restroom',
    active: true,
    moduleRoute: 'family-groups',
  },
  {
    name: 'Administrar Evento',
    route: '/create-events',
    icon: 'event_note',
    active: true,
    moduleRoute: 'capacity',
  },
  {
    name: 'Confirmar Reserva Cédula',
    route: '/verify-asistents',
    icon: 'badge',
    active: true,
    moduleRoute: 'capacity',
  },
  {
    name: 'Confirmar Reserva QR',
    route: '/confirmarReserva',
    icon: 'qr_code_scanner',
    active: true,
    moduleRoute: 'capacity',
  },
  {
    name: 'Cargas Masiva Asistentes',
    route: '/cargaMasiva',
    icon: 'file_upload',
    active: true,
    moduleRoute: 'capacity',
  },
  {
    name: 'Estudiantes de Escuela Dominical',
    route: '/sunday-school-students',
    icon: 'school',
    active: true,
    moduleRoute: 'sunday-school',
  },
  {
    name: 'Gestión de Niveles',
    route: '/sunday-school-levels',
    icon: 'school',
    active: true,
    moduleRoute: 'sunday-school',
  },
  {
    name: 'Gestión de Clases',
    route: '/sunday-school-classes',
    icon: 'school',
    active: true,
    moduleRoute: 'sunday-school',
  },
  {
    name: 'Reportes Escuela Dominical',
    route: '/sunday-school-reports',
    icon: 'assessment',
    active: true,
    moduleRoute: 'sunday-school',
  },
  {
    name: 'Configuración',
    route: '/settings',
    icon: 'settings',
    active: true,
    moduleRoute: 'settings',
  },
];

const PERMISSIONS_MAP: RolePermissionEntry[] = [
  {
    roleName: 'Administrador',
    functionalityNames: [
      'Administrar Evento',
      'Confirmar Reserva Cédula',
      'Confirmar Reserva QR',
      'Cargas Masiva Asistentes',
      'Miembros',
      'Asignación Frentes',
      'Grupos Familiares',
      'Gestionar Usuarios',
      'Estudiantes de Escuela Dominical',
      'Gestión de Niveles',
      'Gestión de Clases',
      'Reportes Escuela Dominical',
      'Configuración',
    ],
    scope: 'all',
    actions: Object.values(ACTION_NAMES).map((name) => ({
      name,
      enabled: true,
    })),
  },
  {
    roleName: 'Coordinador Escuela Dominical',
    functionalityNames: [
      'Estudiantes de Escuela Dominical',
      'Gestión de Niveles',
      'Gestión de Clases',
      'Reportes Escuela Dominical',
    ],
    scope: 'all',
    actions: [
      { name: ACTION_NAMES.CREATE_LEVEL, enabled: true },
      { name: ACTION_NAMES.EDIT_LEVEL, enabled: true },
      { name: ACTION_NAMES.DELETE_LEVEL, enabled: true },
      { name: ACTION_NAMES.CREATE_STUDENT, enabled: true },
      { name: ACTION_NAMES.EDIT_STUDENT, enabled: true },
      { name: ACTION_NAMES.DELETE_STUDENT, enabled: true },
      { name: ACTION_NAMES.CREATE_CLASS, enabled: true },
      { name: ACTION_NAMES.EDIT_CLASS, enabled: true },
      { name: ACTION_NAMES.DELETE_CLASS, enabled: true },
      { name: ACTION_NAMES.REGISTER_ATTENDANCE, enabled: false },
      { name: ACTION_NAMES.PROMOTE_STUDENTS, enabled: true },
      { name: ACTION_NAMES.VIEW_SUNDAY_SCHOOL_REPORTS, enabled: true },
    ],
  },
  {
    roleName: 'Maestro Escuela Dominical',
    functionalityNames: [
      'Estudiantes de Escuela Dominical',
      'Gestión de Niveles',
      'Gestión de Clases',
    ],
    scope: 'own',
    actions: [
      { name: ACTION_NAMES.CREATE_LEVEL, enabled: false },
      { name: ACTION_NAMES.EDIT_LEVEL, enabled: false },
      { name: ACTION_NAMES.DELETE_LEVEL, enabled: false },
      { name: ACTION_NAMES.CREATE_STUDENT, enabled: false },
      { name: ACTION_NAMES.EDIT_STUDENT, enabled: false },
      { name: ACTION_NAMES.DELETE_STUDENT, enabled: false },
      { name: ACTION_NAMES.CREATE_CLASS, enabled: false },
      { name: ACTION_NAMES.EDIT_CLASS, enabled: false },
      { name: ACTION_NAMES.DELETE_CLASS, enabled: false },
      { name: ACTION_NAMES.REGISTER_ATTENDANCE, enabled: true },
      { name: ACTION_NAMES.PROMOTE_STUDENTS, enabled: true },
    ],
  },
  {
    roleName: 'Coordinador Grupos Familiares',
    functionalityNames: ['Grupos Familiares'],
    scope: 'all',
    actions: [
      { name: ACTION_NAMES.CREATE_GROUP, enabled: false },
      { name: ACTION_NAMES.EDIT_GROUP, enabled: false },
      { name: ACTION_NAMES.ADD_GROUP_MEMBER, enabled: false },
      { name: ACTION_NAMES.EDIT_GROUP_MEMBER, enabled: false },
      { name: ACTION_NAMES.REMOVE_GROUP_MEMBER, enabled: false },
      { name: ACTION_NAMES.REGISTER_ATTENDANCE, enabled: false },
    ],
  },
  {
    roleName: 'Líder Grupos Familiares',
    functionalityNames: ['Grupos Familiares'],
    scope: 'own',
    actions: [
      { name: ACTION_NAMES.CREATE_GROUP, enabled: false },
      { name: ACTION_NAMES.EDIT_GROUP, enabled: false },
      { name: ACTION_NAMES.ADD_GROUP_MEMBER, enabled: true },
      { name: ACTION_NAMES.EDIT_GROUP_MEMBER, enabled: true },
      { name: ACTION_NAMES.REMOVE_GROUP_MEMBER, enabled: true },
      { name: ACTION_NAMES.REGISTER_ATTENDANCE, enabled: true },
    ],
  },
  {
    roleName: 'Consolidador',
    functionalityNames: ['Miembros'],
    scope: 'all',
    actions: [],
  },
  {
    roleName: 'Acreditador',
    functionalityNames: ['Confirmar Reserva QR', 'Confirmar Reserva Cédula'],
    scope: 'all',
    actions: [],
  },
  {
    roleName: 'Administrador Eventos',
    functionalityNames: ['Administrar Evento', 'Cargas Masiva Asistentes'],
    scope: 'all',
    actions: [],
  },
];

async function main() {
  if (!MONGO_URI) {
    console.error('ERROR: DEV_DB_CONNECTION environment variable is not set');

    process.exit(1);
  }

  console.log('========================================');
  console.log('Seed: Modules + Functionalities + Role Permissions');
  console.log('Mode: ' + (DRY_RUN ? 'DRY RUN (--dry-run)' : 'EXECUTION'));
  console.log('========================================\n');

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  // 1. Ensure all modules exist (upsert by route).
  const moduleByRoute = new Map<string, ObjectId>();

  for (const moduleSeed of MODULES) {
    const existing = await db
      .collection('modules')
      .findOne({ route: moduleSeed.route });

    if (existing) {
      if (!DRY_RUN) {
        await db
          .collection('modules')
          .updateOne({ route: moduleSeed.route }, { $set: moduleSeed });
        console.log(
          `  ✓ Module ensured: "${moduleSeed.name}" (${moduleSeed.route})`,
        );
      } else {
        console.log(
          `  → (dry-run) Would ensure module: "${moduleSeed.name}" (${moduleSeed.route})`,
        );
      }

      moduleByRoute.set(moduleSeed.route, existing._id);
    } else if (DRY_RUN) {
      console.log(
        `  → (dry-run) Would create module: "${moduleSeed.name}" (${moduleSeed.route})`,
      );
      // Placeholder id so functionality resolution works in dry-run.
      moduleByRoute.set(moduleSeed.route, new ObjectId());
    } else {
      const result = await db.collection('modules').insertOne(moduleSeed);
      moduleByRoute.set(moduleSeed.route, result.insertedId);
      console.log(
        `  ✓ Module created: "${moduleSeed.name}" (${moduleSeed.route})`,
      );
    }
  }

  // 2. Ensure all functionalities exist (upsert by route), linked to module.
  const functionalityByName = new Map<string, ObjectId>();
  const functionalityDocs: { _id: ObjectId; name: string }[] = [];

  for (const funcSeed of FUNCTIONALITIES) {
    const moduleId = moduleByRoute.get(funcSeed.moduleRoute);

    if (!moduleId) {
      console.warn(
        `  ⚠ Module not found for route "${funcSeed.moduleRoute}" — skipping functionality "${funcSeed.name}"`,
      );

      continue;
    }

    const funcDoc = toFunctionalityDocument(funcSeed);
    const existing = await db
      .collection('functionalities')
      .findOne({ route: funcSeed.route });

    if (existing) {
      if (!DRY_RUN) {
        await db
          .collection('functionalities')
          .updateOne(
            { route: funcSeed.route },
            { $set: { ...funcDoc, module: moduleId } },
          );
        console.log(
          `  ✓ Functionality ensured: "${funcSeed.name}" (${funcSeed.route})`,
        );
      } else {
        console.log(
          `  → (dry-run) Would ensure functionality: "${funcSeed.name}" (${funcSeed.route})`,
        );
      }

      functionalityByName.set(funcSeed.name, existing._id);
      functionalityDocs.push({ _id: existing._id, name: funcSeed.name });
    } else if (DRY_RUN) {
      console.log(
        `  → (dry-run) Would create functionality: "${funcSeed.name}" (${funcSeed.route})`,
      );
      const placeholderId = new ObjectId();
      functionalityByName.set(funcSeed.name, placeholderId);
      functionalityDocs.push({ _id: placeholderId, name: funcSeed.name });
    } else {
      const result = await db
        .collection('functionalities')
        .insertOne({ ...funcDoc, module: moduleId });
      functionalityByName.set(funcSeed.name, result.insertedId);
      functionalityDocs.push({ _id: result.insertedId, name: funcSeed.name });
      console.log(
        `  ✓ Functionality created: "${funcSeed.name}" (${funcSeed.route})`,
      );
    }
  }

  // 3. Fetch roles and build rolepermission entries.
  const roles = await db
    .collection('roles')
    .find({})
    .project({ name: 1 })
    .toArray();

  const roleByName = new Map(roles.map((r) => [r.name, r._id]));

  const entries: {
    roleId: ObjectId;
    functionalityId: ObjectId;
    scope: 'all' | 'own';
    actions: { name: string; enabled: boolean }[];
  }[] = [];

  for (const perm of PERMISSIONS_MAP) {
    const roleId = roleByName.get(perm.roleName);

    if (!roleId) {
      console.warn(`  ⚠ Role not found: "${perm.roleName}" — skipping`);

      continue;
    }

    for (const funcName of perm.functionalityNames) {
      const functionalityId = functionalityByName.get(funcName);

      if (!functionalityId) {
        console.warn(
          `  ⚠ Functionality not found: "${funcName}" — skipping for role "${perm.roleName}"`,
        );

        continue;
      }

      entries.push({
        roleId,
        functionalityId,
        scope: perm.scope,
        actions: perm.actions,
      });
    }
  }

  if (entries.length === 0) {
    console.log('No entries to upsert.\n');

    await client.close();

    return;
  }

  console.log(`\nEntries to upsert: ${entries.length}\n`);

  for (const entry of entries) {
    const role = roles.find(
      (r) => r._id.toString() === entry.roleId.toString(),
    );

    const func = functionalityDocs.find(
      (f) => f._id.toString() === entry.functionalityId.toString(),
    );

    console.log(
      `  ${role?.name} → ${func?.name} (scope: ${entry.scope}, actions: ${entry.actions.length})`,
    );

    if (entry.actions.length > 0) {
      const enabled = entry.actions.filter((a) => a.enabled).map((a) => a.name);

      const disabled = entry.actions
        .filter((a) => !a.enabled)
        .map((a) => a.name);

      if (enabled.length > 0)
        console.log(`      enabled:  ${enabled.join(', ')}`);

      if (disabled.length > 0)
        console.log(`      disabled: ${disabled.join(', ')}`);
    }
  }

  console.log();

  if (!DRY_RUN) {
    const operations = entries.map((entry) => ({
      updateOne: {
        filter: {
          roleId: entry.roleId,
          functionalityId: entry.functionalityId,
        },
        update: {
          $set: {
            scope: entry.scope,
            actions: entry.actions,
          },
        },
        upsert: true,
      },
    }));

    const result = await db.collection('rolepermissions').bulkWrite(operations);

    console.log(
      `Result: ${result.upsertedCount} inserted, ${result.modifiedCount} modified, ${result.matchedCount} matched`,
    );
  } else {
    console.log('  → (dry-run, no changes)');
  }

  console.log('\nDone.');

  await client.close();
}

main().catch((err) => {
  console.error('Error:', err);

  process.exit(1);
});
