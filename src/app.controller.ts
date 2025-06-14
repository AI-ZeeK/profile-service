import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { UserService } from './user/user.service';
import {
  GetUserByEmailRequest,
  GetUserContactsRequest,
  PROFILE_SERVICE_NAME,
  UpdateUserStatusRequest,
  GetUserRequest,
  UpdateUserRequest,
} from './shared/dependencies/profile.pb';
import { BusinessUserService } from './user/business-user.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly userService: UserService,
    private readonly businessUserService: BusinessUserService,
  ) {}

  // 👤 User Management

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetUser')
  async getUser(data: GetUserRequest) {
    try {
      this.logger.log(`gRPC: GetUser ${data.user_id}`);

      const user = await this.userService.findOne({
        user_id: data.user_id,
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: this.mapUserResponse(user),
      };
    } catch (error) {
      this.logger.error(`Error in GetUser: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetUserByEmail')
  async getUserByEmail(data: GetUserByEmailRequest) {
    try {
      this.logger.log(`gRPC: GetUserByEmail ${data.email}`);

      const result = await this.userService.fetchByEmail({
        email: data.email,
      });

      return {
        success: result.status,
        message: result.message,
        user: result.data ? this.mapUserResponse(result.data) : null,
      };
    } catch (error) {
      this.logger.error(`Error in GetUserByEmail: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch user',
      };
    }
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'UpdateUserStatus')
  async updateUserStatus(data: UpdateUserStatusRequest) {
    try {
      this.logger.log(`gRPC: UpdateUserStatus ${data.user_id}`);

      const user = await this.userService.updateUserStatus({
        user_id: data.user_id,
        last_seen: data.last_seen,
      });

      return {
        success: true,
        user: this.mapBasicUserResponse(user),
      };
    } catch (error) {
      this.logger.error(`Error in UpdateUserStatus: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetUserContacts')
  async getUserContacts(data: GetUserContactsRequest) {
    try {
      this.logger.log(`gRPC: GetUserContacts for user: ${data.user_id}`);

      // Create a mock request object as expected by the service
      const mockReq = {
        user: { user_id: data.user_id },
      };

      // const contacts = await this.userService.getUserContacts({
      //   req: mockReq as any,
      //   name: data.name || '',
      // });

      return {
        success: true,
        // contacts: contacts.map((contact) => this.mapContactResponse(contact)),
        // total_count: contacts.length,
      };
    } catch (error) {
      this.logger.error(`Error in GetUserContacts: ${error.message}`);
      return {
        success: false,
        error: error.message,
        contacts: [],
        total_count: 0,
      };
    }
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'UpdateUser')
  async updateUser(data: UpdateUserRequest) {
    try {
      this.logger.log(`gRPC: UpdateUser ${data.user_id}`);

      // Create a mock request object as expected by the service
      const mockReqUser = {
        user: { user_id: data.user_id },
      };

      const updateData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone_number,
        avatar_url: data.avatar_url,
        address: data.address,
      };

      // Use orchestrator for distributed transaction
      // const user = await this.userUpdateOrchestrator.updateUserDistributed(
      //   mockReqUser as any,
      //   updateData as any,
      // );

      return {
        success: true,
        // user: this.mapBasicUserResponse(user),
      };
    } catch (error) {
      this.logger.error(`Error in UpdateUser: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetBusinessUser')
  async getBusinessUser(data: GetUserRequest) {
    try {
      this.logger.log(`gRPC: GetBusinessUser ${data.user_id}`);
      const businessUser = await this.businessUserService.getBusinessUser(data);
      return {
        success: true,
        business_user: businessUser,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  // 🛠️ Helper Methods

  private mapUserResponse(user: any) {
    return {
      user_id: user.user_id,
      email: user.email,
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      avatar_url: user.avatar_url || '',
      last_seen: user.last_seen || '',
      created_at: user.created_at?.toISOString() || '',
      updated_at: user.updated_at?.toISOString() || '',
      email_verified: user.email_verified || false,
      address: user.address ? this.mapAddressResponse(user.address) : null,
      user_role: user.user_role
        ? this.mapUserRoleResponse(user.user_role)
        : null,
      business_user: user.business_user
        ? this.mapBusinessUserResponse(user.business_user)
        : null,
    };
  }

  private mapBasicUserResponse(user: any) {
    return {
      user_id: user.user_id,
      email: user.email,
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      last_seen: user.last_seen || '',
      created_at: user.created_at?.toISOString() || '',
      updated_at: user.updated_at?.toISOString() || '',
      email_verified: user.email_verified || false,
    };
  }

  private mapContactResponse(contact: any) {
    return {
      user_id: contact.user_id,
      email: contact.email,
      username: contact.username || '',
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      avatar_url: contact.avatar_url || '',
      last_seen: contact.last_seen || '',
      email_verified: contact.email_verified || false,
    };
  }

  private mapAddressResponse(address: any) {
    return {
      address_id: address.address_id,
      street: address.street || '',
      building: address.building || '',
      apartment: address.apartment || '',
      district: address.district || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      country: address.country || '',
      landmark: address.landmark || '',
      direction_url: address.direction_url || '',
      latitude: address.latitude || 0,
      longitude: address.longitude || 0,
    };
  }

  private mapUserRoleResponse(userRole: any) {
    return {
      user_role_id: userRole.user_role_id || '',
      role_name: userRole.role_name || '',
      is_active: userRole.is_active || false,
    };
  }

  private mapBusinessUserResponse(businessUser: any) {
    return {
      business_user_id: businessUser.business_user_id || '',
      business_name: businessUser.business_name || '',
      is_active: businessUser.is_active || false,
    };
  }
}
