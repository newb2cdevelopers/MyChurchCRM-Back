import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export const Permission = (functionalityRoute: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { functionalityRoute, action });
