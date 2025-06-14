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
import { Helpers } from 'src/lib/helper/helpers';
import { UserService } from 'src/user/user.service';
import { CommunicationService } from 'src/modules/communication/communication.service';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { ROLES_ENUM } from 'prisma/enum';
import { VerificationPurpose } from '@prisma/client';
import {
  SendOtpRequest,
  SendOtpType,
} from 'src/shared/dependencies/profile.pb';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
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
      expiresIn: '15m',
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
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '5m',
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

      if (user) throw new BadGatewayException('User Exists, Proceed to login');
      const role = await this.prisma.role.findUnique({
        where: {
          role_name,
        },
      });

      if (!role) throw new NotFoundException('role type unavailable');

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
      throw new BadRequestException(error.message);
    }
  }
  async register({
    email,
    role_name,
    password,
    organization_name,
    company_ref,
    phone_number,
    organization_email,
    organization_phone_number,
    organization_registration_number,
    organization_registration_date,
  }: {
    email: string;
    password: string;
    role_name: string;
    organization_name: string;
    company_ref: string;
    phone_number: string;
    organization_email: string;
    organization_phone_number: string;
    organization_registration_number: string;
    organization_registration_date: string;
  }) {
    try {
      const { user } = await this.prisma.$transaction(async (prisma) => {
        try {
          let user = await prisma.user.findUnique({
            where: {
              email: email.toLowerCase(),
            },
          });

          if (user)
            throw new BadGatewayException('User Exists, Proceed to login');
          const role = await prisma.role.findUnique({
            where: {
              role_name,
            },
          });

          if (!role) throw new NotFoundException('role unavailable');
          const saltRounds = 10; // Number of salt rounds (higher is more secure but slower)

          const hashed_password = await bcrypt.hash(password, saltRounds);

          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              password: hashed_password, // Store the hashed password
              phone_number,
              user_roles: {
                create: {
                  role_name: role.role_name!,
                  is_active: true,
                },
              },
            },
          });

          if (ROLES_ENUM.BUSINESS_USER === role.role_name) {
            const organization =
              await this.organizationService.createOrganization({
                organization_name,
                phone_number: organization_phone_number,
                email: organization_email,
                registration_number: organization_registration_number,
                registration_date: organization_registration_date,
                creator_id: user.user_id,
              });
            if (!organization.success)
              throw new BadRequestException('organization not created');

            await prisma.businessUser.create({
              data: {
                user_id: user.user_id,
                organization_id:
                  organization.organization?.organization_id || '',
                // access_type: BusinessAccessType.CREATOR,
                access_level: 1,
                is_active: true,
                email: user.email,
              },
            });
          }
          if (ROLES_ENUM.STAFF === role.role_name) {
            const company =
              await this.organizationService.validateCompanyReference({
                company_ref,
              });
            if (!company.success)
              throw new NotFoundException('company not found');
            await prisma.staff.create({
              data: {
                company_id: company?.company_id || '',
                user_id: user.user_id,
              },
            });
          }

          const _user = await prisma.user.findUnique({
            where: {
              user_id: user.user_id,
            },
          });

          return { user: _user };
        } catch (error) {
          throw new BadRequestException(error.message);
        }
      });
      const { access_token } = await this.generateAccessToken({
        user_id: user!.user_id,
      });

      return { user, access_token };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password! || '',
      );
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const { access_token } = await this.generateAccessToken({
        user_id: user.user_id,
      });

      const _user = await this.userService.findOne({
        user_id: user.user_id,
      });

      return { user: _user, access_token };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async logout({ user_id }: { user_id: string }) {
    try {
      await this.prisma.user.update({
        where: { user_id },
        data: { refresh_token: '' },
      });
      await this.communicationService.clearUserPushSubscriptions({
        user_id,
      });
      this.logger.log(
        `User ${user_id} logged out and push subscriptions cleared`,
      );
      return { message: 'Logout successful' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async sendOtp({ token, type }: SendOtpRequest) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      const user = await this.prisma.user.findUnique({
        where: {
          user_id: payload.user_id,
        },
      });
      if (!user) throw new NotFoundException('user for otp not active');
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
      throw new BadRequestException(error.message);
    }
  }

  async refreshToken(user_id: string) {
    try {
      const refreshToken = await this.prisma.user.findUnique({
        where: { user_id },
        select: { refresh_token: true },
      });
      if (!refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
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
        throw new UnauthorizedException('Invalid user');
      }

      const { access_token } = await this.generateAccessToken({
        user_id: user.user_id,
      });

      return { user, access_token };
    } catch (error) {
      console.log('ERROR', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
