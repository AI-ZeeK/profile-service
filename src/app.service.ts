import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllProfiles(query: any) {
    this.logger.log('Getting all profiles', query);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          account_type: true,
          permission_level: true,
          created_at: true,
          updated_at: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
    };
  }

  async getProfile(id: string) {
    this.logger.log(`Getting profile with id: ${id}`);
    const profile = await this.prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        backup_phone_number: true,
        email_verified: true,
        phone_verified: true,
        kyc_verified: true,
        is_blocked: true,
        account_type: true,
        permission_level: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!profile) {
      throw new Error(`Profile with id ${id} not found`);
    }
    return profile;
  }

  async createProfile(profileData: any) {
    this.logger.log('Creating new profile', profileData);
    const newProfile = await this.prisma.user.create({
      data: {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email,
        phone_number: profileData.phone_number,
        backup_phone_number: profileData.backup_phone_number,
        password: profileData.password,
        date_of_birth: profileData.date_of_birth
          ? new Date(profileData.date_of_birth)
          : new Date(),
        account_type: profileData.account_type || 'INDIVIDUAL',
        permission_level: profileData.permission_level || 1,
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        account_type: true,
        permission_level: true,
        created_at: true,
        updated_at: true,
      },
    });
    return newProfile;
  }

  async updateProfile(id: string, profileData: any) {
    this.logger.log(`Updating profile with id: ${id}`, profileData);

    // Check if profile exists
    const existingProfile = await this.prisma.user.findUnique({
      where: { user_id: id },
    });

    if (!existingProfile) {
      throw new Error(`Profile with id ${id} not found`);
    }

    const updatedProfile = await this.prisma.user.update({
      where: { user_id: id },
      data: {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone_number: profileData.phone_number,
        backup_phone_number: profileData.backup_phone_number,
        account_type: profileData.account_type,
        permission_level: profileData.permission_level,
        email_verified: profileData.email_verified,
        phone_verified: profileData.phone_verified,
        kyc_verified: profileData.kyc_verified,
        is_blocked: profileData.is_blocked,
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        backup_phone_number: true,
        email_verified: true,
        phone_verified: true,
        kyc_verified: true,
        is_blocked: true,
        account_type: true,
        permission_level: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updatedProfile;
  }

  async deleteProfile(id: string) {
    this.logger.log(`Deleting profile with id: ${id}`);

    // Check if profile exists
    const existingProfile = await this.prisma.user.findUnique({
      where: { user_id: id },
    });

    if (!existingProfile) {
      throw new Error(`Profile with id ${id} not found`);
    }

    // Soft delete by setting deleted_at timestamp
    await this.prisma.user.update({
      where: { user_id: id },
      data: { deleted_at: new Date() },
    });

    return { success: true, message: 'Profile deleted successfully' };
  }

  async getProfileSettings(id: string) {
    this.logger.log(`Getting settings for profile with id: ${id}`);
    const profile = await this.getProfile(id);
    return {
      user_id: profile.user_id,
      settings: {
        notifications: true,
        privacy: 'public',
        theme: 'light',
        email_verified: profile.email_verified,
        phone_verified: profile.phone_verified,
        kyc_verified: profile.kyc_verified,
        permission_level: profile.permission_level,
      },
    };
  }

  async updateProfileSettings(id: string, settings: any) {
    this.logger.log(`Updating settings for profile with id: ${id}`, settings);

    // Check if profile exists
    const existingProfile = await this.prisma.user.findUnique({
      where: { user_id: id },
    });

    if (!existingProfile) {
      throw new Error(`Profile with id ${id} not found`);
    }

    const updatedProfile = await this.prisma.user.update({
      where: { user_id: id },
      data: {
        email_verified: settings.email_verified,
        phone_verified: settings.phone_verified,
        kyc_verified: settings.kyc_verified,
        permission_level: settings.permission_level,
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        email_verified: true,
        phone_verified: true,
        kyc_verified: true,
        permission_level: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updatedProfile;
  }
}
