import { config } from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import { ACTION_NAMES } from '../src/constants/action-names';

config();

const MONGO_URI = process.env.DEV_DB_CONNECTION;
const DRY_RUN = process.argv.includes('--dry-run');

interface RolePermissionEntry {
  roleName: string;
  functionalityNames: string[];
  scope: 'all' | 'own';
  actions: { name: string; enabled: boolean }[];
}

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
    ],
    scope: 'all',
    actions: Object.values(ACTION_NAMES).map((name) => ({
      name,
      enabled: true,
    })),
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
  console.log('Seed: Role Permissions');
  console.log('Mode: ' + (DRY_RUN ? 'DRY RUN (--dry-run)' : 'EXECUTION'));
  console.log('========================================\n');

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  // Fetch roles and functionalities from DB
  const roles = await db
    .collection('roles')
    .find({})
    .project({ name: 1 })
    .toArray();

  const functionalities = await db
    .collection('functionalities')
    .find({})
    .project({ name: 1 })
    .toArray();

  const roleByName = new Map(roles.map((r) => [r.name, r._id]));

  const functionalityByName = new Map(
    functionalities.map((f) => [f.name, f._id]),
  );

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

  console.log(`Entries to upsert: ${entries.length}\n`);

  for (const entry of entries) {
    const role = roles.find(
      (r) => r._id.toString() === entry.roleId.toString(),
    );

    const func = functionalities.find(
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
