import { Injectable } from '@nestjs/common';
import { Role } from 'src/schemas/roles/role.schema';
import { RoleProvider } from 'src/providers/role/role.provider'

@Injectable()
export class RoleBusiness {
  constructor(private readonly provider: RoleProvider) {}

  async getAllRoles(): Promise<Role[]> {
    return this.provider.getAllRoles() as unknown as Promise<Role[]>;
  }

  async createRole(newRole:Role): Promise<Role> {
    return this.provider.CreateRole(newRole) as unknown as Promise<Role>;
  }
}
