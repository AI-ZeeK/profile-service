import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private profiles: any[] = []; // In-memory storage for demo

  async getAllProfiles(query: any) {
    this.logger.log('Getting all profiles', query);
    return {
      data: this.profiles,
      total: this.profiles.length,
      page: query.page || 1,
      limit: query.limit || 10,
    };
  }

  async getProfile(id: string) {
    this.logger.log(`Getting profile with id: ${id}`);
    const profile = this.profiles.find((p) => p.id === id);
    if (!profile) {
      throw new Error(`Profile with id ${id} not found`);
    }
    return profile;
  }

  async createProfile(profileData: any) {
    this.logger.log('Creating new profile', profileData);
    const newProfile = {
      id: Date.now().toString(),
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.push(newProfile);
    return newProfile;
  }

  async updateProfile(id: string, profileData: any) {
    this.logger.log(`Updating profile with id: ${id}`, profileData);
    const profileIndex = this.profiles.findIndex((p) => p.id === id);
    if (profileIndex === -1) {
      throw new Error(`Profile with id ${id} not found`);
    }

    this.profiles[profileIndex] = {
      ...this.profiles[profileIndex],
      ...profileData,
      updated_at: new Date().toISOString(),
    };

    return this.profiles[profileIndex];
  }

  async deleteProfile(id: string) {
    this.logger.log(`Deleting profile with id: ${id}`);
    const profileIndex = this.profiles.findIndex((p) => p.id === id);
    if (profileIndex === -1) {
      throw new Error(`Profile with id ${id} not found`);
    }

    this.profiles.splice(profileIndex, 1);
    return { success: true, message: 'Profile deleted successfully' };
  }

  async getProfileSettings(id: string) {
    this.logger.log(`Getting settings for profile with id: ${id}`);
    const profile = await this.getProfile(id);
    return {
      id: profile.id,
      settings: profile.settings || {
        notifications: true,
        privacy: 'public',
        theme: 'light',
      },
    };
  }

  async updateProfileSettings(id: string, settings: any) {
    this.logger.log(`Updating settings for profile with id: ${id}`, settings);
    const profileIndex = this.profiles.findIndex((p) => p.id === id);
    if (profileIndex === -1) {
      throw new Error(`Profile with id ${id} not found`);
    }

    this.profiles[profileIndex] = {
      ...this.profiles[profileIndex],
      settings: {
        ...this.profiles[profileIndex].settings,
        ...settings,
      },
      updated_at: new Date().toISOString(),
    };

    return this.profiles[profileIndex];
  }
}
