/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ADDRESS_TYPE_ENUM, FILE_ENTITY_TYPE_ENUM } from 'prisma/enum';
import { UserAuthorizedRequest } from 'src/interfaces/user.interface';
import { Prisma, User } from '@prisma/client';
import { UpdateUserDto } from './dto/create-user.dto';
import { Logger } from '@nestjs/common';
import {
  CreateOrUpdateBusinessUserRoleRequest,
  GetOrganizationBusinessUsersRequest,
  GetUserRequest,
} from 'src/shared/dependencies/profile.pb';
import { RpcException } from '@nestjs/microservices';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';

type UserWithAvatar<T = {}> = User & {
  avatar_url: string | null;
} & T;

@Injectable()
export class BusinessUserService {
  private readonly logger = new Logger(BusinessUserService.name);

  constructor(
    private prisma: PrismaService,
    private organizationService: OrganizationsService,
  ) {}

  async getBusinessUser(payload: GetUserRequest) {
    try {
      const businessUser = await this.prisma.businessUser.findFirst({
        where: {
          user_id: payload.userId,
        },
        include: {
          user: true,
        },
      });
      if (!businessUser) {
        throw new RpcException({
          code: 404,
          message: 'Business user not found',
        });
      }
      businessUser.user.password = '';
      const organization = await this.organizationService.getOrganization({
        organizationId: businessUser.organization_id,
      });

      return {
        success: true,
        business_user: businessUser,
        organization: organization.organization,
        company: organization?.company,
      };
    } catch (error) {
      throw new RpcException({
        code: 400,
        message: error.message,
      });
    }
  }

  async createOrUpdateBusinessUserRole(
    payload: CreateOrUpdateBusinessUserRoleRequest,
  ) {
    try {
      const { businessUserIds, organizationRoleId } = payload;
      for (const business_user_id of businessUserIds) {
        // Set all roles for this user to inactive
        await this.prisma.businessUserRole.updateMany({
          where: {
            business_user_id,
            is_active: true,
          },
          data: {
            is_active: false,
          },
        });

        // Check if the user already has this role
        const existingRole = await this.prisma.businessUserRole.findFirst({
          where: {
            business_user_id,
            organization_role_id: organizationRoleId,
          },
        });

        if (existingRole) {
          // Set this role to active
          await this.prisma.businessUserRole.update({
            where: {
              business_user_id,
              organization_role_id: organizationRoleId,
            },
            data: {
              is_active: true,
            },
          });
        } else {
          // Create the new role as active
          await this.prisma.businessUserRole.create({
            data: {
              business_user_id,
              organization_role_id: organizationRoleId,
              is_active: true,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Business user role handled successfully',
      };
    } catch (error) {
      throw new RpcException({
        code: 400,
        message: error.message,
      });
    }
  }

  async getOrganizationBusinessUsers({
    organizationId,
    companyId,
  }: GetOrganizationBusinessUsersRequest) {
    try {
      if (companyId) {
        const companyVerification =
          await this.organizationService.verifyCompanyId({
            companyId: companyId,
            organizationId: organizationId,
          });
        if (!companyVerification.success) {
          throw new RpcException(
            `Invalid company: ${
              companyVerification.error || 'Company not found'
            }`,
          );
        }
      }

      const businessUsers = await this.prisma.businessUser.findMany({
        where: {
          organization_id: organizationId,
          ...(companyId ? { company_id: companyId } : {}),
        },
        include: {
          user: true,
          business_user_roles: true,
        },
      });

      return {
        success: true,
        business_users: businessUsers,
      };
    } catch (error) {
      throw new RpcException({
        code: 400,
        message: error.message,
      });
    }
  }
}
