import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from 'src/user/user.service';
import { CommunicationService } from 'src/modules/communication/communication.service';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { ROLES_ENUM } from 'prisma/enum';
import { VerificationPurpose } from '@prisma/client';
import {
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  SendOtpRequest,
  SendOtpType,
  VerifyOtpRequest,
} from 'src/shared/dependencies/profile.pb';
import { RpcException } from '@nestjs/microservices';
import { Helpers } from '@djengo/proto-contracts';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectQueue('organization') private orgQueue: Queue,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private userService: UserService,
    private communicationService: CommunicationService,
    private organizationService: OrganizationsService,
  ) {}

  async validateRefreshToken({
    user_id,
    refresh_token,
  }: {
    user_id: string;
    refresh_token: string;
  }) {
    try {
      const user = await this.prisma.user.findUnique({ where: { user_id } });

      if (!user || !user.refresh_token) {
        return null;
      }

      const isValid = await bcrypt.compare(refresh_token, user.refresh_token);
      if (!isValid) {
        return null;
      }

      const newAccessToken = this.generateAccessToken({
        user_id,
      });

      return {
        user_id: user.user_id,
        access_token: newAccessToken,
      };
    } catch (error) {
      console.error('Error validating refresh token:', error);
      return null;
    }
  }

  async generateAccessToken({ user_id }: { user_id: string }) {
    const payload = {
      user_id,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '3h',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    await this.prisma.user.update({
      where: { user_id },
      data: {
        refresh_token: refresh_token,
      },
    });

    return { access_token };
  }

  generateAuthToken({ user_id }: { user_id: string }) {
    const payload = {
      user_id,
    };

    const auth_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_AUTH_SECRET,
      expiresIn: '10m',
    });

    return { auth_token };
  }

  async initiateRegister({
    email,
    role_name,
  }: {
    email: string;
    role_name: string;
  }) {
    try {
      let user = await this.prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });

      if (user)
        throw new RpcException({
          code: 400,
          message: 'User Exists, Proceed to login',
        });
      const role = await this.prisma.role.findUnique({
        where: {
          role_name,
        },
      });

      if (!role)
        throw new RpcException({
          code: 404,
          message: 'role type unavailable',
        });

      user = await this.prisma.user.create({
        data: {
          email,
          user_roles: {
            create: {
              role_name,
            },
          },
        },
      });

      return this.generateAuthToken({ user_id: user.user_id });
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }
  async register({
    email,
    password,
    companyRef,
    phoneNumber,
    roleName,
  }: RegisterRequest) {
    try {
      let user = await this.prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });

      if (user)
        throw new RpcException({
          code: 400,
          message: 'User Exists, Proceed to login',
        });
      const role = await this.prisma.role.findUnique({
        where: {
          role_name: roleName as unknown as string,
        },
      });

      if (!role)
        throw new RpcException({
          code: 404,
          message: 'role unavailable',
        });
      const saltRounds = 10; // Number of salt rounds (higher is more secure but slower)

      const hashed_password = await bcrypt.hash(password, saltRounds);

      user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashed_password, // Store the hashed password
          phone_number: phoneNumber,
          user_roles: {
            create: {
              role_name: role.role_name!,
              is_active: true,
            },
          },
        },
      });

      if (ROLES_ENUM.BUSINESS_USER === role.role_name) {
        console.log('CREATING ORG FOR USER', user.user_id);

        await this.orgQueue.add(
          'create_organization',
          {
            organizationName: '',
            phoneNumber: '',
            email: '',
            registrationNumber: '',
            registrationDate: '',
          },
          {
            attempts: 3, // retry 3 times
            backoff: {
              type: 'exponential',
              delay: 5000, // 5 seconds, then 10, then 20
            },
          },
        );
      }
      if (ROLES_ENUM.STAFF === role.role_name) {
        const company = await this.organizationService.validateCompanyReference(
          {
            companyRef: companyRef || '',
          },
        );
        if (!company.success)
          throw new RpcException({
            code: 404,
            message: 'company not found',
          });
        await this.prisma.staff.create({
          data: {
            company_id: company?.companyId || '',
            user_id: user.user_id,
          },
        });
      }

      const { auth_token } = await this._sendOtp({
        user_id: user!.user_id,
        email: user?.email,
        name: user?.email?.split('@')[0],
        type: SendOtpType.REGISTRATION,
      });
      return {
        message: 'ACCOUNT CREATED SUCCESSFULLY, OTP SENT TO EMAIL',
        authToken: auth_token,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private async _sendOtp({
    user_id,
    email,
    name,
    type,
  }: {
    user_id: string;
    email: string;
    name: string;
    type: SendOtpType;
  }) {
    const otp = Helpers.generateOTP({
      length: 6,
      options: {
        numbers: true,
      },
    });
    await this.prisma.verification.create({
      data: {
        user_id: user_id,
        otp_code: otp,
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        expires_at: Helpers.getFutureTimestamp({ seconds: 70 }),
      },
    });

    this.logger.log('OTP SENT', otp);

    // await this.communicationService.sendOtp({
    //   email: email,
    //   name: name,
    //   otp,
    //   type: type,
    // });

    const { auth_token } = await this.generateAuthToken({
      user_id: user_id,
    });
    return { auth_token };
  }

  // private async validateCompanyReference(
  //   company_name: string,
  // ): Promise<string> {
  //   try {
  //     const company_ref = Helpers.generateUniqueValue(company_name);
  //     const reference = await this.prisma.company.findUnique({
  //       where: {
  //         company_ref,
  //       },
  //     });
  //     if (reference) {
  //       return await this.validateCompanyReference(company_name);
  //     }
  //     return company_ref;
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }
  async login({ email, password }: { email: string; password: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });
      if (!user) {
        throw new RpcException({
          code: 404,
          message: 'User not found',
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password! || '',
      );
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      if (!isPasswordValid) {
        throw new RpcException({
          code: 401,
          message: 'Invalid credentials',
        });
      }

      const { auth_token } = await this._sendOtp({
        user_id: user.user_id,
        email: user?.email,
        name: user?.email?.split('@')[0],
        type: SendOtpType.SIGNIN,
      });

      return {
        message: 'LOGIN SUCCESSFUL & OTP SENT',
        authToken: auth_token,
      };
    } catch (error) {
      this.logger.error('Login error', error);
      throw new RpcException({
        code: 500,
        message: error.message,
      });
    }
  }

  async logout({ userId }: LogoutRequest) {
    try {
      console.log('LOGOUT REQUEST', userId);
      await this.prisma.user.update({
        where: { user_id: userId },
        data: { refresh_token: '' },
      });
      await this.communicationService.clearUserPushSubscriptions({
        userId,
      });
      this.logger.log(
        `User ${userId} logged out and push subscriptions cleared`,
      );
      return { message: 'Logout successful' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async sendOtp({ token, type }: SendOtpRequest) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_AUTH_SECRET,
      });
      const user = await this.prisma.user.findUnique({
        where: {
          user_id: payload.user_id,
        },
      });
      if (!user)
        throw new RpcException({
          code: 404,
          message: 'user for otp not active',
        });
      const otp = Helpers.generateOTP({
        length: 6,
        options: {
          numbers: true,
        },
      });
      await this.prisma.verification.create({
        data: {
          user_id: payload.user_id,
          otp_code: otp,
          purpose: VerificationPurpose.EMAIL_VERIFICATION,
          expires_at: Helpers.getFutureTimestamp({ seconds: 95 }),
        },
      });
      this.logger.log('OTP SENT', otp);
      await this.communicationService.sendOtp({
        email: user?.email,
        name: user?.email?.split('@')[0],
        otp,
        type: type,
      });
      return {
        message: 'otp sent successfully',
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async verifyOtp({ otp, token, type }: VerifyOtpRequest) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_AUTH_SECRET,
      });
      const verification = await this.prisma.verification.findFirst({
        where: { user_id: payload.user_id, otp_code: otp },
      });
      if (!verification) {
        throw new RpcException({
          code: 401,
          message: 'Invalid OTP',
        });
      }
      if (verification.expires_at < new Date()) {
        await this.prisma.verification.delete({
          where: { verification_id: verification.verification_id },
        });

        throw new RpcException({
          code: 401,
          message: 'OTP expired',
        });
      }
      await this.prisma.verification.delete({
        where: { verification_id: verification.verification_id },
      });

      if (type === SendOtpType.REGISTRATION) {
        await this.prisma.user.update({
          where: { user_id: payload.user_id },
          data: { email_verified: true },
        });
      }

      const { access_token } = await this.generateAccessToken({
        user_id: payload.user_id,
      });
      const user = await this.userService.findOne({
        user_id: payload.user_id,
      });
      await this.prisma.verification.deleteMany({
        where: { user_id: payload.user_id },
      });
      return {
        message: 'OTP verified successfully',
        accessToken: access_token,
        user: Helpers.toCamelCase(user),
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async refreshToken(data: RefreshTokenRequest) {
    try {
      if (!data.userId) {
        throw new RpcException({
          code: 401,
          message: 'Invalid user',
        });
      }
      const refreshToken = await this.prisma.user.findUnique({
        where: { user_id: data.userId },
        select: { refresh_token: true },
      });
      if (!refreshToken) {
        throw new RpcException({
          code: 401,
          message: 'Invalid refresh token',
        });
      }
      const payload = await this.jwtService.verifyAsync(
        refreshToken.refresh_token,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );
      // console.log('PAYLOAD', payload);
      const user = await this.prisma.user.findUnique({
        where: { user_id: payload.user_id },
      });
      // console.log('USER', user);
      if (!user) {
        throw new RpcException({
          code: 401,
          message: 'Invalid user',
        });
      }

      const { access_token } = await this.generateAccessToken({
        user_id: user.user_id,
      });

      return { user, accessToken: access_token };
    } catch (error) {
      throw new RpcException({
        code: 401,
        message: 'Invalid refresh token',
      });
    }
  }
}
