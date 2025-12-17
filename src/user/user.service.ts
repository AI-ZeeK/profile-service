/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserAuthorizedRequest } from 'src/interfaces/user.interface';
import { BusinessUser, Prisma, User, UserRole } from '@prisma/client';
import { UpdateUserDto } from './dto/create-user.dto';
import { FilesService } from 'src/modules/files/files.service';
import { AddressService } from 'src/modules/address/address.service';
import { Logger } from '@nestjs/common';
import {
  AdminUsersAnalyticsRequest,
  GetUserRequest,
  GetUsersRequest,
  Timeline,
  UpdateUserRequest,
  ValidateAccountRequest,
} from 'src/shared/dependencies/profile.pb';
import { RpcException } from '@nestjs/microservices';
import {
  ADDRESS_TYPE_ENUM,
  FILE_ENTITY_TYPE_ENUM,
  Helpers,
} from '@djengo/proto-contracts';
import { JwtService } from '@nestjs/jwt';
import { Address } from 'src/shared/dependencies/address.pb';
import { FinancialsService } from 'src/modules/financials/financials.service';

type UserWithAvatar<T = {}> = User & {
  avatar_url: string | null;
  business_user: BusinessUser | undefined;
  address: Address | undefined;
  user_role: UserRole | undefined;
} & T;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private addressService: AddressService,
    private jwtService: JwtService,
    private financialsService: FinancialsService,
  ) {}
  async findOne<T extends Prisma.UserInclude>(
    where: Prisma.UserWhereUniqueInput,
    include?: T,
    sample_data?: boolean,
  ): Promise<UserWithAvatar<User> | null> {
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
        address: address.address,
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
        secret: process.env.JWT_ACCESS_SECRET,
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
          country_code: data.countryCode || undefined,
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

  async adminGetUsers({
    search,
    pageSize,
    page,
    sortBy,
    sortOrder,
  }: GetUsersRequest) {
    try {
      page = Number(page) > 0 ? Number(page) : 1;
      const page_size = Number(pageSize) > 0 ? Number(pageSize) : 10;
      search = search?.trim() || '';
      sortBy = sortBy || 'created_at';
      sortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

      const userTableFields = [
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'created_at',
        'updated_at',
        'last_login',
        'is_active',
      ];

      const where: any = {};
      if (search) {
        where.OR = [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone_number: { contains: search, mode: 'insensitive' } },
        ];
      }

      const total = await this.prisma.user.count({ where });

      const total_pages = Math.ceil(total / page_size) || 1;
      const current_page = Math.min(page, total_pages);
      const skip = (current_page - 1) * page_size;

      const prismaQuery: any = {
        where,
        include: {
          user_roles: {
            where: { is_active: true },
            include: {
              role: true,
            },
          },
          business_users: true,
        },
        skip,
        take: page_size,
      };

      if (userTableFields.includes(sortBy)) {
        prismaQuery.orderBy = { [sortBy]: sortOrder };
      }
      const users = await this.prisma.user.findMany(prismaQuery);

      return {
        users: users.map((user) => Helpers.sanitizeUser(user)),
        meta: {
          total,
          current_page,
          page_size,
          total_pages,
          next_page: current_page < total_pages ? current_page + 1 : null,
          prev_page: current_page > 1 ? current_page - 1 : null,
        },
      };
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }

  /**
   * Returns analytics for user dashboard cards, supporting timeline and role filters.
   * @param options { timeline: '1m'|'3m'|'6m'|'1y'|null, startDate?: string, endDate?: string, role?: string }
   */
  async AdminGetUserAnalytics(options: AdminUsersAnalyticsRequest) {
    try {
      const { timeline, startDate, endDate, roleId } = options;
      // Date range filter
      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;
      let prevDateFrom: Date | undefined;
      let prevDateTo: Date | undefined;
      const now = new Date();
      if (timeline) {
        switch (timeline as Timeline) {
          case Timeline._1m:
            dateFrom = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              now.getDate(),
            );
            prevDateFrom = new Date(
              now.getFullYear(),
              now.getMonth() - 2,
              now.getDate(),
            );
            prevDateTo = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              now.getDate(),
            );
            break;
          case Timeline._3m:
            dateFrom = new Date(
              now.getFullYear(),
              now.getMonth() - 3,
              now.getDate(),
            );
            prevDateFrom = new Date(
              now.getFullYear(),
              now.getMonth() - 6,
              now.getDate(),
            );
            prevDateTo = new Date(
              now.getFullYear(),
              now.getMonth() - 3,
              now.getDate(),
            );
            break;
          case Timeline._6m:
            dateFrom = new Date(
              now.getFullYear(),
              now.getMonth() - 6,
              now.getDate(),
            );
            prevDateFrom = new Date(
              now.getFullYear(),
              now.getMonth() - 12,
              now.getDate(),
            );
            prevDateTo = new Date(
              now.getFullYear(),
              now.getMonth() - 6,
              now.getDate(),
            );
            break;
          case Timeline._1y:
            dateFrom = new Date(
              now.getFullYear() - 1,
              now.getMonth(),
              now.getDate(),
            );
            prevDateFrom = new Date(
              now.getFullYear() - 2,
              now.getMonth(),
              now.getDate(),
            );
            prevDateTo = new Date(
              now.getFullYear() - 1,
              now.getMonth(),
              now.getDate(),
            );
            break;
        }
        dateTo = now;
      }
      if (startDate) dateFrom = new Date(startDate);
      if (endDate) dateTo = new Date(endDate);
      if (startDate && endDate) {
        // Calculate previous period for custom range
        const diff =
          new Date(endDate).getTime() - new Date(startDate).getTime();
        prevDateTo = new Date(new Date(startDate).getTime());
        prevDateFrom = new Date(new Date(startDate).getTime() - diff);
      }

      // Helper to build where clause
      const buildWhere = (extra: any = {}, prev = false) => {
        const where: any = { ...extra };
        let from = prev ? prevDateFrom : dateFrom;
        let to = prev ? prevDateTo : dateTo;
        if (from || to) {
          where.created_at = {};
          if (from) where.created_at.gte = from;
          if (to) where.created_at.lte = to;
        }
        if (roleId) {
          where.user_roles = {
            some: {
              role: { role_id: roleId },
              is_active: true,
            },
          };
        }
        return where;
      };

      // Helper to compute trend
      const computeTrend = (current: number, prev: number) => {
        if (prev === 0 && current > 0)
          return { percentage: 100, trend: 'neutral' };
        if (prev === 0 && current === 0)
          return { percentage: 0, trend: 'neutral' };
        const diff = current - prev;
        const pct = prev !== 0 ? (diff / prev) * 100 : 0;
        let trend: 'increase' | 'decrease' | 'neutral' = 'neutral';
        if (pct > 0) trend = 'increase';
        else if (pct < 0) trend = 'decrease';
        else if (pct === 0) trend = 'neutral';
        return { percentage: Math.round(pct * 10) / 10, trend };
      };

      // Total users
      const totalUsers = await this.prisma.user.count({ where: buildWhere() });
      const totalUsersPrev = await this.prisma.user.count({
        where: buildWhere({}, true),
      });
      const totalUsersTrend = computeTrend(totalUsers, totalUsersPrev);

      // Active users (last_login within the last month)
      const oneMonthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );
      const activeUsers = 120;
      const activeUsersPrev = 810;
      // const activeUsers = await this.prisma.user.count({
      //   where: buildWhere({ last_login: { gte: oneMonthAgo, not: null } }),
      // });
      // const activeUsersPrev = await this.prisma.user.count({
      //   where: buildWhere(
      //     { last_login: { gte: oneMonthAgo, not: null } },
      //     true,
      //   ),
      // });
      const activeUsersTrend = computeTrend(activeUsers, activeUsersPrev);

      // Business users
      const businessUsers = await this.prisma.user.count({
        where: buildWhere({ business_users: { some: { is_active: true } } }),
      });
      const businessUsersPrev = await this.prisma.user.count({
        where: buildWhere(
          { business_users: { some: { is_active: true } } },
          true,
        ),
      });
      const businessUsersTrend = computeTrend(businessUsers, businessUsersPrev);

      // New users this month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const newUsers = await this.prisma.user.count({
        where: buildWhere({ created_at: { gte: monthStart, lte: now } }),
      });
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );
      const newUsersPrev = await this.prisma.user.count({
        where: buildWhere(
          { created_at: { gte: prevMonthStart, lte: prevMonthEnd } },
          true,
        ),
      });
      const newUsersThisMonthTrend = computeTrend(newUsers, newUsersPrev);

      // Pending approvals
      const pendingUsers = 7;
      const pendingUsersPrev = 5;
      // const pendingUsers = await this.prisma.user.count({
      //   where: buildWhere({ last_login: null }),
      // });
      // const pendingUsersPrev = await this.prisma.user.count({
      //   where: buildWhere({ last_login: null }, true),
      // });
      const pendingUsersTrend = computeTrend(pendingUsers, pendingUsersPrev);

      // Deactivated users (no active user_roles)
      const deactivatedUsers = await this.prisma.user.count({
        where: buildWhere({ deleted_at: null }),
      });
      const deactivatedUsersPrev = await this.prisma.user.count({
        where: buildWhere({ deleted_at: null }, true),
      });
      const deactivatedUsersTrend = computeTrend(
        deactivatedUsers,
        deactivatedUsersPrev,
      );

      // High-value users
      // TODO: Fetch high-value users from transactions microservice (users with 100+ transactions)
      const highValueUsers = 42; // MOCK VALUE
      const highValueUsersPrev = 35; // MOCK VALUE
      const highValueUsersTrend = computeTrend(
        highValueUsers,
        highValueUsersPrev,
      );

      // At-risk users (last_login < 30 days ago and last_login not null)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const atRiskUsers = 4;
      const atRiskUsersPrev = 1;
      // const atRiskUsers = await this.prisma.user.count({
      //   where: buildWhere({ last_login: { lt: thirtyDaysAgo, not: null } }),
      // });
      // const atRiskUsersPrev = await this.prisma.user.count({
      //   where: buildWhere(
      //     { last_login: { lt: thirtyDaysAgo, not: null } },
      //     true,
      //   ),
      // });
      const atRiskUsersTrend = computeTrend(atRiskUsers, atRiskUsersPrev);

      return {
        total_users: { value: totalUsers, ...totalUsersTrend },
        active_users: { value: activeUsers, ...activeUsersTrend },
        business_users: { value: businessUsers, ...businessUsersTrend },
        new_users: {
          value: newUsers,
          ...newUsersThisMonthTrend,
        },
        pending_users: { value: pendingUsers, ...pendingUsersTrend },
        deactivated_users: {
          value: deactivatedUsers,
          ...deactivatedUsersTrend,
        },
        high_value_users: { value: highValueUsers, ...highValueUsersTrend },
        at_risk_users: { value: atRiskUsers, ...atRiskUsersTrend },
      };
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }
}
