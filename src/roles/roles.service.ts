import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ROLES_ENUM } from '@djengo/proto-contracts';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}
  findAll() {
    return this.prisma.role.findMany();
  }

  findMany() {
    return this.prisma.role.findMany({
      where: {
        role_name: {
          notIn: [ROLES_ENUM.PLATFORM],
        },
      },
    });
  }
}
