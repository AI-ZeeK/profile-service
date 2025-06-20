import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Helpers, ROLES_ENUM } from '@djengo/proto-contracts';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}
  findAll() {
    return this.prisma.role.findMany();
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
