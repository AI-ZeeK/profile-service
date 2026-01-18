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
import { SessionSource, VerificationPurpose } from '@prisma/client';
import {
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  SendOtpRequest,
  SendOtpType,
  VerifyOtpRequest,
} from 'src/shared/dependencies/profile.pb';
import { RpcException } from '@nestjs/microservices';
import { Helpers, LoginRequest } from '@djengo/proto-contracts';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Env } from 'src/config/configuration';

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
    source,
  }: {
    user_id: string;
    refresh_token: string;
    source: string;
  }) {
    try {
      const user = await this.prisma.userSession.findFirst({
        where: { user_id, source: SessionSource[source] || SessionSource.WEB },
      });

      if (!user || !user.refresh_token) {
        return null;
      }

      const isValid = await bcrypt.compare(refresh_token, user.refresh_token);
      if (!isValid) {
        return null;
      }

      const newAccessToken = this.generateAccessToken({
        user_id,
        source,
        device_info: user.device_info,
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

  async generateAccessToken({
    user_id,
    device_info,
    source,
  }: {
    user_id: string;
    device_info: string;
    source: string;
  }) {
    const payload = {
      user_id,
      source,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: Env.JWT_ACCESS_SECRET,
      expiresIn: '3h',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: Env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    await this.prisma.userSession.upsert({
      where: {
        unique_session: {
          user_id,
          source: SessionSource[source] || SessionSource.WEB,
        },
      },
      update: {
        refresh_token: refresh_token,
        device_info: device_info,
      },
      create: {
        refresh_token: refresh_token,
        user_id: user_id,
        device_info: device_info,
        source: SessionSource[source] || SessionSource.WEB,
      },
    });

    return { access_token };
  }

  generateAuthToken({ user_id }: { user_id: string }) {
    const payload = {
      user_id,
    };

    const auth_token = this.jwtService.sign(payload, {
      secret: Env.JWT_AUTH_SECRET,
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
      if (ROLES_ENUM.BUSINESS_USER === role.role_name) {
        const businessUser = await this.prisma.businessUser.findUnique({
          where: {
            email,
          },
        });

        if (businessUser) {
          throw new RpcException({
            code: 400,
            message: 'User with this email already exists, Proceed to login',
          });
        }
      }
      if (ROLES_ENUM.STAFF === role.role_name) {
        const staffUser = await this.prisma.staff.findUnique({
          where: {
            email,
          },
        });
        if (staffUser) {
          throw new RpcException({
            code: 400,
            message: 'User with this email already exists, Proceed to login',
          });
        }
      }
      const saltRounds = 10; // Number of salt rounds (higher is more secure but slower)

      const hashed_password = await bcrypt.hash(password, saltRounds);

      user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          user_slug: Helpers.generateUserSlug(),
          password: hashed_password, // Store the hashed password
          ...(phoneNumber ? { phone_number: phoneNumber } : {}),
          user_roles: {
            create: {
              role_name: role.role_name!,
              is_active: true,
            },
          },
        },
      });

      if (ROLES_ENUM.BUSINESS_USER === role.role_name) {
        // console.log('CREATING ORG FOR USER', user.user_id);

        await this.orgQueue.add(
          'create_organization',
          {
            organizationName: '',
            phoneNumber: '',
            email: user.email || '',
            registrationNumber: '',
            registrationDate: '',
            creatorId: user.user_id,
          },
          {
            attempts: 3, // retry 3 times
            backoff: {
              type: 'exponential',
              delay: 5000, // 5 seconds, then 10, then 20
            },
          },
        );
        console.log('QUEUED ORG FOR USER', user.user_id);
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
            email,
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
  async login({ email, password }: LoginRequest) {
    try {
      // const user = await this.prisma.user.findUnique({
      //   where: {
      //     email: email.toLowerCase(),
      //   },
      //   include:{
      //   user_roles:true
      //   }
      // });
      let user = await this.userService.findOne({
        email: email.toLowerCase(),
      });
      if (!user) {
        const businessUser = await this.prisma.businessUser.findUnique({
          where: {
            email: email.toLowerCase(),
          },
        });
        if (!businessUser) {
          throw new RpcException({
            code: 404,
            message: 'user not found',
          });
        }

        user = await this.userService.findOne({
          user_id: businessUser.user_id,
        });
      }
      if (!user) {
        throw new RpcException({
          code: 404,
          message: 'user not found',
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

  async logout({ userId, source }: LogoutRequest) {
    try {
      console.log('LOGOUT REQUEST', userId, source, SessionSource[source]);
      await this.prisma.userSession.deleteMany({
        where: {
          user_id: userId,
          source: SessionSource[source] || SessionSource.WEB,
        },
      });
      // await this.communicationService.clearUserPushSubscriptions({
      //   userId,
      // });
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
        secret: Env.JWT_AUTH_SECRET,
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

  async verifyOtp({ otp, token, type, deviceInfo }: VerifyOtpRequest) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: Env.JWT_AUTH_SECRET,
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
        source: payload.source,
        device_info: deviceInfo,
      });
      await this.prisma.user.update({
        where: { user_id: payload.user_id },
        data: { last_login: new Date() },
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
        user: user,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async refreshToken(data: RefreshTokenRequest) {
    try {
      if (!data.token) {
        throw new RpcException({
          code: 401,
          message: 'Invalid user',
        });
      }
      const session = await this.prisma.userSession.findFirst({
        where: { refresh_token: data.token },
        select: { refresh_token: true },
      });
      if (!session) {
        throw new RpcException({
          code: 401,
          message: 'Invalid refresh token',
        });
      }
      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(session.refresh_token, {
          secret: Env.JWT_ACCESS_SECRET,
        });
      } catch {
        payload = this.jwtService.decode(session.refresh_token);
        if (!payload || !payload.user_id) {
          throw new RpcException({
            code: 401,
            message: 'Invalid access token',
          });
        }
      }

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
        source: payload.source,
        device_info: payload.device_info,
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
