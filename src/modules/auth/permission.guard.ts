import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePermissionProvider } from 'src/providers/role-permission/role-permission.provider';
import { UserProvider } from 'src/providers/user/user.provider';
import { PERMISSION_KEY } from './permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolePermissionProvider: RolePermissionProvider,
    private readonly userProvider: UserProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<{
      functionalityRoute: string;
      action: string;
    }>(PERMISSION_KEY, context.getHandler());

    if (!permission) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) throw new ForbiddenException();

    const user = await this.userProvider.getUserById(userId);
    if (!user?.roles?.length) throw new ForbiddenException();

    const roleIds = user.roles.map((r: unknown) => r.toString());
    const permissions = await this.rolePermissionProvider.findByRoleIds(
      roleIds,
    );

    const route = permission.functionalityRoute.startsWith('/')
      ? permission.functionalityRoute
      : '/' + permission.functionalityRoute;

    const hasAction = permissions.some((p) => {
      // functionalityId is populated at runtime with the Functionality document, even though the schema types it as a string.
      const funcDoc = p.functionalityId as unknown as { route?: string };
      if (funcDoc?.route !== route) return false;

      return p.actions?.some((a) => a.name === permission.action && a.enabled);
    });

    if (!hasAction) throw new ForbiddenException();

    return true;
  }
}
