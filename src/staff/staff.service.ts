import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AcceptInvitationRequest,
  ManyStaffDetailsRequest,
  PaginatedCompanyRequest,
  RequestFilter,
  ResendStaffInvitationRequest,
  SendStaffInvitationsRequest,
  StaffDetailsRequest,
} from 'src/shared/dependencies/profile.pb';
import { CommunicationService } from 'src/modules/communication/communication.service';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { InvitationStatus, Staff } from '@prisma/client';
import { ADDRESS_TYPE_ENUM, Helpers } from '@djengo/proto-contracts';
import { AddressService } from 'src/modules/address/address.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private communicationService: CommunicationService,
    private organizationService: OrganizationsService,
    private addressService: AddressService,
    private userService: UserService,
  ) {}

  async getStaffDetails(data: StaffDetailsRequest) {
    try {
      const staff = await this.prisma.staff.findFirst({
        where: { staff_id: data.staffId, company_id: data.companyId },
        include: {
          user: true,
        },
      });
      if (!staff) {
        throw new RpcException('Staff not found');
      }
      const user = await this.userService.findOne({
        user_id: staff.user?.user_id,
      });
      if (!user) {
        throw new RpcException('Associated user not found');
      }
      return { staff: Object.assign(staff, { user }) };
    } catch (error) {
      throw new RpcException('Failed to retrieve staff by ID');
    }
  }

  async getManyStaffDetails(data: ManyStaffDetailsRequest) {
    try {
      const staffs = await this.prisma.staff.findMany({
        where: { staff_id: { in: data.staffIds }, company_id: data.companyId },
      });
      for (const staff of staffs as any) {
        staff.created_at =
          staff.created_at?.toISOString?.() ?? staff.created_at;
        staff.updated_at =
          staff.updated_at?.toISOString?.() ?? staff.updated_at;
        staff.user = await this.userService.findOne({ user_id: staff.user_id });
      }
      return { success: true, staffs };
    } catch (error) {
      throw new RpcException('Failed to retrieve staff details');
    }
  }

  async getCompanyStaffs(data: PaginatedCompanyRequest) {
    try {
      const companyVerification =
        await this.organizationService.verifyCompanyId({
          companyId: data.companyId,
          organizationId: data.organizationId,
        });
      if (!companyVerification.success) {
        throw new RpcException(
          `Invalid company: ${companyVerification.error || 'Company not found'}`,
        );
      }

      // Build Prisma query
      const where: any = {
        company_id: data.companyId,
      };
      if (data.filter === RequestFilter.INACTIVE) where.is_active = false;
      if (data.filter === RequestFilter.ACTIVE) where.is_active = true;
      if (!data.filter) where.is_active = true;
      if (data.search) {
        where.email = { contains: data.search, mode: 'insensitive' };
      }

      // Sorting
      let orderBy: any = { created_at: 'desc' };
      if (
        data.sortBy &&
        ['email', 'created_at', 'status'].includes(data.sortBy)
      ) {
        orderBy = {
          [data.sortBy]:
            data.sortOrder && data.sortOrder.toLowerCase() === 'asc'
              ? 'asc'
              : 'desc',
        };
      }

      // Pagination
      const page = data.page && data.page > 0 ? data.page : 1;
      const pageSize = data.pageSize && data.pageSize > 0 ? data.pageSize : 10;

      // Get total count for pagination
      const total = await this.prisma.staff.count({ where });

      const staffs = await this.prisma.staff.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: true,
        },
      });

      for (const staff of staffs as any) {
        const role = await this.organizationService.verifyRoleId({
          companyId: data.companyId,
          roleId: staff.role_id || '',
        });

        staff.role = role.role || null;
        staff.created_at = staff.created_at.toISOString();
      }

      const total_pages = Math.ceil(total / pageSize);
      const current_page = page;

      return {
        message: 'Company staffs retrieved successfully',
        staffs,
        meta: {
          total,
          current_page,
          page_size: pageSize,
          total_pages,
          next_page: current_page < total_pages ? current_page + 1 : null,
          prev_page: current_page > 1 ? current_page - 1 : null,
        },
      };
    } catch (error: any) {
      throw new RpcException(`FETCH STAFF ERROR ${error.stack}`);
    }
  }
  async getInvitationsByCompany(data: PaginatedCompanyRequest) {
    try {
      const companyVerification =
        await this.organizationService.verifyCompanyId({
          companyId: data.companyId,
          organizationId: data.organizationId,
        });
      if (!companyVerification.success) {
        throw new RpcException(
          `Invalid company: ${companyVerification.error || 'Company not found'}`,
        );
      }

      // Build Prisma query
      const where: any = { company_id: data.companyId };
      if (data.search) {
        where.email = { contains: data.search, mode: 'insensitive' };
      }

      // Sorting
      let orderBy: any = { created_at: 'desc' };
      if (
        data.sortBy &&
        ['email', 'created_at', 'status'].includes(data.sortBy)
      ) {
        orderBy = {
          [data.sortBy]:
            data.sortOrder && data.sortOrder.toLowerCase() === 'asc'
              ? 'asc'
              : 'desc',
        };
      }

      // Pagination
      const page = data.page && data.page > 0 ? data.page : 1;
      const pageSize = data.pageSize && data.pageSize > 0 ? data.pageSize : 10;

      // Get total count for pagination
      const total = await this.prisma.staffInvitation.count({ where });

      const invitations = await this.prisma.staffInvitation.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      for (const invitation of invitations as any) {
        const role = await this.organizationService.verifyRoleId({
          companyId: data.companyId,
          roleId: invitation.role_id || '',
        });
        invitation.role = role.role || null;
        invitation.created_at = invitation.created_at.toISOString();
      }

      const total_pages = Math.ceil(total / pageSize);
      const current_page = page;

      return {
        invitations,
        meta: {
          total,
          current_page,
          page_size: pageSize,
          total_pages,
          next_page: current_page < total_pages ? current_page + 1 : null,
          prev_page: current_page > 1 ? current_page - 1 : null,
        },
      };
    } catch (error: any) {
      throw new RpcException(`FETCH INVITATIONS ERROR ${error.stack}`);
    }
  }

  /**
   * Send staff onboarding invitations
   * Creates invitation records and sends emails
   * OPTIMIZED: Batches database queries and parallelizes email sending
   */
  async sendStaffInvitations(data: SendStaffInvitationsRequest) {
    try {
      // Verify company exists
      const companyVerification =
        await this.organizationService.verifyCompanyId({
          companyId: data.companyId,
          organizationId: data.organizationId,
        });
      if (!companyVerification.success) {
        throw new RpcException(
          `Invalid company: ${companyVerification.error || 'Company not found'}`,
        );
      }

      const companyName = companyVerification.company?.name || 'the company';
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const expirationHours = 4;
      const emails = data.invitations.map((inv) => inv.email.toLowerCase());

      // Batch verification of branch, department, and role IDs in parallel
      const verificationPromises: Promise<any>[] = [];
      const branchIds = [
        ...new Set(
          data.invitations
            .map((inv) => inv.branchId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const departmentIds = [
        ...new Set(
          data.invitations
            .map((inv) => inv.departmentId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const roleIds = [
        ...new Set(
          data.invitations
            .map((inv) => inv.roleId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      if (branchIds.length > 0) {
        verificationPromises.push(
          Promise.all(
            branchIds.map((branchId) =>
              this.organizationService.verifyBranchId({
                branchId: branchId,
                companyId: data.companyId,
                organizationId: data.organizationId,
              }),
            ),
          ),
        );
      }
      if (departmentIds.length > 0) {
        verificationPromises.push(
          Promise.all(
            departmentIds.map((departmentId) =>
              this.organizationService.verifyDepartmentId({
                departmentId: departmentId,
                companyId: data.companyId,
                organizationId: data.organizationId,
              }),
            ),
          ),
        );
      }
      if (roleIds.length > 0) {
        verificationPromises.push(
          Promise.all(
            roleIds.map((id: string) =>
              this.organizationService.verifyRoleId({
                companyId: data.companyId,
                roleId: id,
              }),
            ),
          ),
        );
      }

      const verificationResults = await Promise.all(verificationPromises);
      const branchVerifications = (verificationResults[0] as any[]) || [];
      const departmentVerifications = (verificationResults[1] as any[]) || [];
      const roleVerifications = (verificationResults[2] as any[]) || [];

      // Create lookup maps for failed verifications
      const failedBranches = new Set(
        branchVerifications
          .filter((v) => !v.success)
          .map((_, i) => branchIds[i]),
      );
      const failedDepartments = new Set(
        departmentVerifications
          .filter((v) => !v.success)
          .map((_, i) => departmentIds[i]),
      );
      const failedRoles = new Set(
        roleVerifications.filter((v) => !v.success).map((_, i) => roleIds[i]),
      );

      // Batch query: Check for existing invitations and staff in single queries
      const [existingInvitations, existingStaffList] = await Promise.all([
        this.prisma.staffInvitation.findMany({
          where: {
            email: { in: emails },
            company_id: data.companyId,
            status: InvitationStatus.PENDING,
            expires_at: { gt: new Date() },
          },
        }),
        this.prisma.staff.findMany({
          where: {
            email: { in: emails },
            company_id: data.companyId,
            is_active: true,
          },
          select: { email: true },
        }),
      ]);

      const existingInvitationMap = new Map<
        string,
        (typeof existingInvitations)[number]
      >(existingInvitations.map((inv) => [inv.email, inv]));
      const existingStaffEmails = new Set(
        existingStaffList.map((s) => s.email),
      );

      // Prepare invitations to create
      interface InvitationToCreate {
        invitation: (typeof data.invitations)[number];
        invitationCode: string;
        expiresAt: Date;
      }
      const invitationsToCreate: InvitationToCreate[] = [];
      const results: {
        email: string;
        success: boolean;
        message: string;
        invitationId?: string;
        expiresAt?: string;
        invitationUrl?: string;
      }[] = [];

      // Pre-calculate expiration time once
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      for (const invitation of data.invitations) {
        const emailLower = invitation.email.toLowerCase();

        // Check branch verification
        if (invitation.branchId && failedBranches.has(invitation.branchId)) {
          results.push({
            email: invitation.email,
            success: false,
            message: 'Invalid branch: Branch not found',
          });
          continue;
        }

        // Check department verification
        if (
          invitation.departmentId &&
          failedDepartments.has(invitation.departmentId)
        ) {
          results.push({
            email: invitation.email,
            success: false,
            message: 'Invalid department: Department not found',
          });
          continue;
        }

        // Check role verification
        if (invitation.roleId && failedRoles.has(invitation.roleId)) {
          results.push({
            email: invitation.email,
            success: false,
            message: 'Invalid role: Role not found',
          });
          continue;
        }

        // Check for existing pending invitation
        if (existingInvitationMap.has(emailLower)) {
          const existing = existingInvitationMap.get(emailLower)!;
          results.push({
            email: invitation.email,
            success: false,
            message: 'Pending invitation already exists for this email',
            invitationId: existing.invitation_id,
            expiresAt: existing.expires_at?.toISOString(),
            invitationUrl: `${baseUrl}/invite/accept?code=${existing.invitation_code}`,
          });
          continue;
        }

        // Check if already staff
        if (existingStaffEmails.has(emailLower)) {
          results.push({
            email: invitation.email,
            success: false,
            message: 'User is already a staff member at this company',
          });
          continue;
        }

        // Generate invitation code and prepare for creation
        const invitationCode = Helpers.generateReferenceId({
          company_name: companyName,
        });

        invitationsToCreate.push({
          invitation: invitation,
          invitationCode,
          expiresAt,
        });
      }

      // Batch create all invitations in a transaction
      type CreatedInvitation = Awaited<
        ReturnType<typeof this.prisma.staffInvitation.create>
      >;
      const createdInvitations: CreatedInvitation[] = [];
      if (invitationsToCreate.length > 0) {
        const created = await this.prisma.$transaction(
          invitationsToCreate.map((inv) =>
            this.prisma.staffInvitation.create({
              data: {
                company_id: data.companyId,
                branch_id: inv.invitation.branchId || null,
                department_id: inv.invitation.departmentId || null,
                role_id: inv.invitation.roleId || null,
                email: inv.invitation.email.toLowerCase(),
                invitation_code: inv.invitationCode,
                invited_by_user_id: data.invitedBy,
                expires_at: inv.expiresAt,
                status: InvitationStatus.PENDING,
              },
            }),
          ),
        );
        createdInvitations.push(...created);
      }

      // Send emails in parallel (fire and forget pattern with error handling)
      const emailPromises: Promise<void>[] = [];

      for (let i = 0; i < invitationsToCreate.length; i++) {
        const inv = invitationsToCreate[i];
        const createdInv = createdInvitations[i];
        const invitationUrl = `${baseUrl}/staff-onboarding?code=${inv.invitationCode}`;

        // Push email promise without awaiting
        emailPromises.push(
          this.communicationService
            .sendStaffInvitationMail({
              email: inv.invitation.email,
              invitationUrl,
              companyName,
            })
            .then(() => {
              results.push({
                email: inv.invitation.email,
                success: true,
                message: 'Invitation sent successfully',
                invitationId: createdInv.invitation_id,
                expiresAt: inv.expiresAt.toISOString(),
                invitationUrl,
              });
            })
            .catch(() => {
              results.push({
                email: inv.invitation.email,
                success: false,
                message: 'Invitation created but email delivery failed',
                invitationId: createdInv.invitation_id,
              });
            }),
        );
      }

      // Wait for all emails to be sent
      await Promise.all(emailPromises);

      return {
        success: true,
        results,
        message: `Processed ${results.length} invitation(s)`,
      };
    } catch (error) {
      throw new RpcException(
        `Failed to send staff invitations: ${error.message}`,
      );
    }
  }

  /**
   * Resend a staff invitation if expired. Updates status to PENDING and sends email again.
   * Cannot resend for DECLINED or ACCEPTED invitations.
   */
  async resendStaffInvitation({
    invitationCode,
  }: ResendStaffInvitationRequest) {
    try {
      const invitation = await this.prisma.staffInvitation.findUnique({
        where: { invitation_code: invitationCode },
      });
      if (!invitation) {
        throw new RpcException('Invitation not found');
      }
      if (invitation.status === InvitationStatus.ACCEPTED) {
        throw new RpcException('Cannot resend: invitation already accepted');
      }
      if (invitation.status === InvitationStatus.DECLINED) {
        throw new RpcException('Cannot resend: invitation was declined');
      }
      if (
        invitation.status === InvitationStatus.PENDING &&
        invitation.expires_at > new Date()
      ) {
        throw new RpcException('Cannot resend: invitation is still active');
      }

      // Generate new expiration date
      const expirationHours = 4;
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + expirationHours);

      // Update invitation status and expiration
      await this.prisma.staffInvitation.update({
        where: { invitation_code: invitationCode },
        data: {
          status: InvitationStatus.PENDING,
          expires_at: newExpiresAt,
          responsed_at: null,
        },
      });

      // Send invitation email again
      const company = await this.organizationService.getCompanyById(
        invitation.company_id,
      );
      const companyName = company?.name || 'the company';
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const invitationUrl = `${baseUrl}/staff-onboarding?code=${invitation.invitation_code}`;

      await this.communicationService.sendStaffInvitationMail({
        email: invitation.email,
        invitationUrl,
        companyName,
      });

      return {
        success: true,
        message: 'Invitation resent successfully',
        invitation_code: invitation.invitation_code,
        expires_at: newExpiresAt.toISOString(),
        invitationUrl,
      };
    } catch (error) {
      throw new RpcException(`Failed to resend invitation: ${error.message}`);
    }
  }

  async acceptInvitation(data: AcceptInvitationRequest) {
    const {
      invitationCode,
      firstName,
      lastName,
      phoneNumber,
      countryCode,
      address,
      password,
    } = data;
    try {
      const invitation = await this.prisma.staffInvitation.findUnique({
        where: { invitation_code: invitationCode },
      });

      if (!invitation) {
        throw new RpcException('Invitation not found');
      }
      if (invitation.status === InvitationStatus.DELETED) {
        throw new RpcException('Invitation has been deleted');
      }
      if (invitation.status === 'ACCEPTED') {
        throw new RpcException('Invitation already accepted');
      }
      if (invitation.status === InvitationStatus.DECLINED) {
        throw new RpcException('Invitation was declined');
      }
      if (invitation.expires_at < new Date()) {
        await this.prisma.staffInvitation.update({
          where: { invitation_code: invitationCode },
          data: { status: InvitationStatus.EXPIRED },
        });
        throw new RpcException('Invitation has expired');
      }

      const _company_detail =
        await this.organizationService.validateCompanyReference({
          companyRef: invitation.company_id || '',
        });
      if (!_company_detail.success) {
        throw new RpcException({ code: 404, message: 'company not found' });
      }

      let user = await this.prisma.user.findFirst({
        where: { email: invitation.email },
      });
      let staff: Staff | null = null;
      if (user) {
        // Check if staff already exists for this company
        staff = await this.prisma.staff.findFirst({
          where: {
            user_id: user.user_id,
            company_id: _company_detail.company?.companyId,
            is_active: true,
          },
        });
        if (staff) {
          // Update invitation status
          await this.prisma.staffInvitation.update({
            where: { invitation_code: invitationCode },
            data: {
              status: InvitationStatus.ACCEPTED,
              responsed_at: new Date(),
            },
          });
          return {
            success: true,
            message: 'Invitation already accepted, staff exists',
            staff,
          };
        }
      } else {
        // Create user
        const saltRounds = 10;
        const hashed_password = await bcrypt.hash(password, saltRounds);

        user = await this.prisma.user.create({
          data: {
            email: invitation.email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber || null,
            country_code: countryCode || '',
            password: hashed_password,
          },
        });
        // Create address for user
        await this.addressService.createOrUpdateAddress({
          entityType: ADDRESS_TYPE_ENUM.USER_HOME, // ADDRESS_TYPE_ENUM.USER_HOME
          entityId: user.user_id,
          street: address?.street || '',
          building: address?.building || '',
          apartment: address?.apartment || '',
          district: address?.district || '',
          city: address?.city || '',
          state: address?.state || '',
          postalCode: address?.postalCode || '',
          country: address?.country || '',
          landmark: address?.landmark || '',
          directionUrl: address?.directionUrl || '',
          latitude: address?.latitude || 0,
          longitude: address?.longitude || 0,
        });
      }

      staff = await this.prisma.staff.create({
        data: {
          company_id: _company_detail.company?.companyId || '',
          user_id: user.user_id,
          email: invitation.email,
          branch_id: invitation.branch_id,
          role_id: invitation.role_id,
          is_active: true,
          profile_complete: false,
        },
      });

      if (invitation.department_id) {
        await this.prisma.staffDepartment.create({
          data: {
            staff_id: staff.staff_id,
            department_id: invitation.department_id,
            is_active: true,
          },
        });
      }

      await this.prisma.staffInvitation.update({
        where: { invitation_code: invitationCode },
        data: {
          status: InvitationStatus.ACCEPTED,
          responsed_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Invitation accepted successfully',
        staff,
      };
    } catch (error) {
      throw new RpcException(`Failed to accept invitation: ${error.message}`);
    }
  }

  async deleteStaffInvitation(invitationCode: string) {
    try {
      const invitation = await this.prisma.staffInvitation.findUnique({
        where: { invitation_code: invitationCode },
      });
      if (!invitation) {
        throw new RpcException('Invitation not found');
      }
      await this.prisma.staffInvitation.update({
        where: { invitation_code: invitationCode },
        data: {
          status: InvitationStatus.DELETED,
        },
      });
      return {
        success: true,
        message: 'Invitation deleted successfully',
      };
    } catch (error) {
      throw new RpcException(`Failed to delete invitation: ${error.message}`);
    }
  }

  async declineInvitation(invitationCode: string) {
    try {
      const invitation = await this.prisma.staffInvitation.findUnique({
        where: { invitation_code: invitationCode },
      });

      if (!invitation) {
        throw new RpcException('Invitation not found');
      }
      if (invitation.status === InvitationStatus.DELETED) {
        throw new RpcException('Invitation has been deleted');
      }
      if (invitation.status === InvitationStatus.ACCEPTED) {
        throw new RpcException('Cannot decline an accepted invitation');
      }

      await this.prisma.staffInvitation.update({
        where: { invitation_code: invitationCode },
        data: {
          status: InvitationStatus.DECLINED,
          responsed_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Invitation declined',
      };
    } catch (error) {
      throw new RpcException(`Failed to decline invitation: ${error.message}`);
    }
  }

  async getInvitationByCode(invitationCode: string) {
    try {
      const invitation = await this.prisma.staffInvitation.findUnique({
        where: { invitation_code: invitationCode },
      });

      if (!invitation) {
        throw new RpcException('Invitation not found');
      }

      // Check if expired
      if (
        invitation.expires_at < new Date() &&
        invitation.status !== InvitationStatus.EXPIRED
      ) {
        await this.prisma.staffInvitation.update({
          where: { invitation_code: invitationCode },
          data: { status: InvitationStatus.EXPIRED },
        });
        invitation.status = InvitationStatus.EXPIRED;
      }

      if (
        !invitation.responsed_at &&
        invitation.status === InvitationStatus.PENDING
      ) {
        await this.prisma.staffInvitation.update({
          where: { invitation_code: invitationCode },
          data: {
            status: InvitationStatus.VIEWED,
            responsed_at: new Date(),
          },
        });
      }

      const company = await this.organizationService.getCompanyById(
        invitation.company_id,
      );
      const role = await this.organizationService.verifyRoleId({
        companyId: invitation.company_id,
        roleId: invitation.role_id || '',
      });

      return {
        success: true,
        invitation: {
          ...invitation,
          role,
          company,
        },
      };
    } catch (error) {
      throw new RpcException(`Failed to retrieve invitation: ${error.message}`);
    }
  }
}
