/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserAuthorizedRequest } from 'src/interfaces/user.interface';
import { Prisma, User } from '@prisma/client';
import { UpdateUserDto } from './dto/create-user.dto';
import { FilesService } from 'src/modules/files/files.service';
import { AddressService } from 'src/modules/address/address.service';
import { Logger } from '@nestjs/common';
import {
  GetUserRequest,
  UpdateUserRequest,
  ValidateAccountRequest,
} from 'src/shared/dependencies/profile.pb';
import { RpcException } from '@nestjs/microservices';
import {
  ADDRESS_TYPE_ENUM,
  FILE_ENTITY_TYPE_ENUM,
} from '@djengo/proto-contracts';
import { JwtService } from '@nestjs/jwt';

type UserWithAvatar<T = {}> = User & {
  avatar_url: string | null;
} & T;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private addressService: AddressService,
    private jwtService: JwtService,
  ) {}
  async findOne<T extends Prisma.UserInclude>(
    where: Prisma.UserWhereUniqueInput,
    include?: T,
    sample_data?: boolean,
  ) {
    try {
      const userData = await this.prisma.user.findUnique({
        where,
        include: {
          user_roles: {
            where: {
              is_active: true,
            },
          },
          business_users: true,
          ...include,
        },
      });

      if (!userData) {
        return null;
      }

      const address = await this.addressService.verifyAddress({
        entityType: ADDRESS_TYPE_ENUM.USER_HOME,
        entityId: userData.user_id,
      });

      const avatarFile = await this.filesService.verifyFile({
        entityType: FILE_ENTITY_TYPE_ENUM.USER_AVATAR,
        entityId: userData.user_id,
      });

      const user_role = userData.user_roles.find((role) => role.is_active);

      const business_user = userData.business_users.find(
        (user) => user.is_active,
      );

      return {
        ...userData,
        address,
        avatar_url: avatarFile?.fileUrl || null,
        user_role: user_role,
        business_user: business_user,
      };
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }

  async validateAccount({ token }: ValidateAccountRequest) {
    try {
      this.logger.log('HITTING THIS ENDPOINT', token);
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ADMIN_ACCESS_SECRET,
      });

      if (!payload) {
        throw new RpcException('Invalid token');
      }
      const user = await this.findOne({
        user_id: payload.user_id,
      });
      if (!user) {
        this.logger.error('no user', user);
        throw new RpcException({
          code: 500,
          message: 'User not found',
        });
      }
      this.logger.log('user', user);

      console.log('USER VALID,user', user);
      return { success: true, user };
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }
  // async findOneAdmin<T extends Prisma.UserInclude>(
  //   where: Prisma.PlatformUserWhereUniqueInput,
  //   include?: T,
  //   sample_data?: boolean,
  // ) {
  //   try {
  //     const userData = await this.prisma.platformUser.findUnique({
  //       where,
  //       include: {
  //         ...include,
  //       },
  //     });

  //     if (!userData) {
  //       return null;
  //     }

  //     const address = await this.addressService.verifyAddress({
  //       entityType: ADDRESS_TYPE_ENUM.USER_HOME,
  //       entityId: userData.user_id,
  //     });

  //     const avatarFile = await this.filesService.verifyFile({
  //       entityType: FILE_ENTITY_TYPE_ENUM.PLATFORM_USER_AVATAR,
  //       entityId: userData.user_id,
  //     });

  //     return {
  //       ...userData,
  //       address,
  //       avatar_url: avatarFile?.fileUrl || null,
  //     };
  //   } catch (error) {
  //     throw new RpcException({
  //       code: 500,
  //       message: error.message,
  //     });
  //   }
  // }

  // async fetchAllAdmin() {
  //   try {
  //     const users = await this.prisma.platformUser.findMany({
  //       include: {
  //         role: true,
  //       },
  //     });
  //     return {
  //       success: true,
  //       message: 'Users fetched successfully',
  //       users: users,
  //     };
  //   } catch (error) {
  //     throw new RpcException({
  //       code: 500,
  //       message: error.message,
  //     });
  //   }
  // }

  // async fetchAdminAccount({ user_id }: { user_id: string }) {
  //   try {
  //     const users = await this.findOneAdmin({
  //       user_id: user_id,
  //     });
  //     return users;
  //   } catch (error) {
  //     throw new RpcException({
  //       code: 500,
  //       message: error.message,
  //     });
  //   }
  // }
  async fetchByEmail({ email }: { email: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });

      if (!user)
        return {
          success: false,
          message: 'User with email does not exist',
          user: null,
        };
      return {
        success: true,
        message: 'User with email exists',
        user: user,
      };
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }

  async updateUserStatus({
    user_id,
    last_seen,
  }: {
    user_id: string;
    last_seen: string;
  }) {
    try {
      const user = await this.prisma.user.update({
        where: { user_id },
        data: { last_seen },
      });
      return user;
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }

  async updateUser(data: UpdateUserRequest) {
    const results = {
      user: null as any,
      address: { success: false, error: null as string | null },
      avatar: { success: false, error: null as string | null },
      overall_success: false,
    };

    try {
      // Step 1: Update user basic info (Critical - if this fails, stop)
      const user = await this.prisma.user.update({
        where: { user_id: data.userId },
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone_number: data.phoneNumber,
        },
      });

      results.user = user;
      results.overall_success = true; // At least user update succeeded

      // Step 2: Handle address update (Non-critical - continue if fails)
      if (data.address) {
        try {
          this.logger.log(`Updating address for user: ${user.user_id}`);

          await this.addressService.createOrUpdateAddress({
            entityType: ADDRESS_TYPE_ENUM.USER_HOME,
            entityId: user.user_id,
            street: data.address.street || '',
            building: data.address.building || '',
            apartment: data.address.apartment || '',
            district: data.address.district || '',
            city: data.address.city || '',
            state: data.address.state || '',
            postalCode: data.address.postalCode || '',
            country: data.address.country || '',
            landmark: data.address.landmark || '',
            directionUrl: data.address.directionUrl || '',
            latitude: data.address.latitude || 0,
            longitude: data.address.longitude || 0,
          });

          results.address.success = true;
          this.logger.log(
            `Address updated successfully for user: ${user.user_id}`,
          );
        } catch (addressError) {
          results.address.error = addressError.message;
          this.logger.warn(
            `Address service failed for user ${user.user_id}: ${addressError.message}`,
          );
          // Continue execution - don't fail the whole operation
        }
      }

      // Step 3: Handle avatar update (Non-critical - continue if fails)
      if (data.avatarUrl) {
        try {
          this.logger.log(`Updating avatar for user: ${user.user_id}`);

          await this.filesService.createOrUpdateFile({
            entityType: FILE_ENTITY_TYPE_ENUM.USER_AVATAR,
            entityId: user.user_id,
            fileUrl: data.avatarUrl,
          });

          results.avatar.success = true;
          this.logger.log(
            `Avatar updated successfully for user: ${user.user_id}`,
          );
        } catch (fileError) {
          results.avatar.error = fileError.message;
          this.logger.warn(
            `Files service failed for user ${user.user_id}: ${fileError.message}`,
          );
          // Continue execution - don't fail the whole operation
        }
      }

      // Log overall results
      this.logger.log(`User update completed for ${user.user_id}:`, {
        user_updated: true,
        address_updated: results.address.success,
        avatar_updated: results.avatar.success,
        partial_failure: !results.address.success || !results.avatar.success,
      });

      return {
        success: true,
        user: user,
      };
    } catch (error) {
      // Critical failure - user update failed
      this.logger.error(`Critical failure in user update: ${error.message}`);
      throw new RpcException({
        code: 500,
        message: `Failed to update user: ${error.message}`,
      });
    }
  }

  async updateUserBasic({
    req_user,
    data,
  }: {
    req_user: UserAuthorizedRequest;
    data: Partial<UpdateUserDto>;
  }) {
    try {
      // Update only basic user info - no address or avatar
      const user = await this.prisma.user.update({
        where: { user_id: req_user.user.user_id },
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone_number: data.phone_number,
        },
      });

      return user;
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }

  async getUser(payload: GetUserRequest) {
    try {
      const user = await this.findOne({
        user_id: payload.userId,
      });
      if (!user) {
        throw new RpcException({
          code: 404,
          message: 'User not found',
        });
      }
      return {
        success: true,
        user: user,
      };
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }
}
