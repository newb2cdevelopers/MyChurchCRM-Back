import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { RoleBusiness } from 'src/business/roles/roles.bl';
import { Role } from 'src/schemas/roles/role.schema';

@ApiTags('Roles')
@Controller('role')
export class RoleController {
  constructor(private readonly roleBusiness: RoleBusiness) {}

  @Get()
  @ApiCreatedResponse({ description: 'Roles Info' })
  async getRoles(): Promise< Role [] > {
    return  await this.roleBusiness.getAllRoles();
  }

  @Post()
  async newRole(@Body() role: Role, @Request() req): Promise<Role> {
    return await this.roleBusiness.createRole(role);
  }
}
