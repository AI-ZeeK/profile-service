import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Helpers, ROLES_ENUM } from '@djengo/proto-contracts';
import { OrganizationIdRequest } from 'src/shared/dependencies/organization.pb';
import { OrganizationRoleIdRequest } from 'src/shared/dependencies/profile.pb';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}
  findAll() {
    return this.prisma.role.findMany();
  }

  async findAllByOrganization(data: OrganizationRoleIdRequest) {
    const business_user_roles = await this.prisma.businessUserRole.findMany({
      where: {
        organization_role_id: data.organizationRoleId,
        is_active: true,
      },
    });

    return {
      roles: business_user_roles,
    };
  }
  async findAllCountByOrganization(data: OrganizationRoleIdRequest) {
    return this.prisma.businessUserRole.count({
      where: {
        organization_role_id: data.organizationRoleId,
        is_active: true,
      },
    });
  }

  async findMany() {
    const roles = await this.prisma.role.findMany({
      where: {
        role_name: {
          notIn: [ROLES_ENUM.PLATFORM],
        },
      },
    });
    console.log(roles);
    return {
      success: true,
      message: JSON.stringify(roles),
      status: 200,
      roles: Helpers.toCamelCase(roles),
    };
  }
}
