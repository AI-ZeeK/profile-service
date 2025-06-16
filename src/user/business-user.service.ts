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
import { GetUserRequest } from 'src/shared/dependencies/profile.pb';
import { RpcException } from '@nestjs/microservices';

type UserWithAvatar<T = {}> = User & {
  avatar_url: string | null;
} & T;

@Injectable()
export class BusinessUserService {
  private readonly logger = new Logger(BusinessUserService.name);

  constructor(private prisma: PrismaService) {}

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
      return {
        success: true,
        business_user: businessUser,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
