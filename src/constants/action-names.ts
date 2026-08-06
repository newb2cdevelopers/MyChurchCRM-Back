export const ACTION_NAMES = {
  // Family Groups
  CREATE_GROUP: 'create_group',
  EDIT_GROUP: 'edit_group',
  ADD_GROUP_MEMBER: 'add_group_member',
  EDIT_GROUP_MEMBER: 'edit_group_member',
  REMOVE_GROUP_MEMBER: 'remove_group_member',
  REGISTER_ATTENDANCE: 'register_attendance',
  // Sunday School
  CREATE_LEVEL: 'create_level',
  EDIT_LEVEL: 'edit_level',
  DELETE_LEVEL: 'delete_level',
  CREATE_STUDENT: 'create_student',
  EDIT_STUDENT: 'edit_student',
  DELETE_STUDENT: 'delete_student',
  CREATE_CLASS: 'create_class',
  EDIT_CLASS: 'edit_class',
  DELETE_CLASS: 'delete_class',
} as const;

export type ActionName = (typeof ACTION_NAMES)[keyof typeof ACTION_NAMES];
