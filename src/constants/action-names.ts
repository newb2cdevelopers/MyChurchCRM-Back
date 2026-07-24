export const ACTION_NAMES = {
  CREATE_GROUP: 'create_group',
  EDIT_GROUP: 'edit_group',
  ADD_GROUP_MEMBER: 'add_group_member',
  EDIT_GROUP_MEMBER: 'edit_group_member',
  REMOVE_GROUP_MEMBER: 'remove_group_member',
  REGISTER_ATTENDANCE: 'register_attendance',
} as const;

export type ActionName = (typeof ACTION_NAMES)[keyof typeof ACTION_NAMES];
