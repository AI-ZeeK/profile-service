import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('business-user')
export class BusinessUserProcessor {
  private logger = new Logger(BusinessUserProcessor.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationService: OrganizationsService,
  ) {}

  @Process('create_business_user')
  async handleCreateBusinessUser(job: Job) {
    const data = job.data;
    this.logger.log('👤 Creating business user for:', data);
    try {
      // First, check if the user exists
      const userExists = await this.prisma.user.findUnique({
        where: { user_id: data.user_id },
      });

      if (!userExists) {
        this.logger.error(`❌ User ${data.user_id} does not exist in database`);
        throw new Error(
          `User ${data.user_id} not found - cannot create business user`,
        );
      }

      this.logger.log('✅ User exists, proceeding with business user creation');

      // Check if business user already exists by email
      let business_user_by_email = await this.prisma.businessUser.findUnique({
        where: {
          email: data.email,
        },
      });
      this.logger.log(
        '👤 Found existing business user by email:',
        business_user_by_email,
      );
      if (business_user_by_email) {
        this.logger.log(
          '✅ Business user already exists by email, skipping creation',
        );
        return true;
      }

      // Check if business user already exists by user_id and organization_id combination
      let business_user = await this.prisma.businessUser.findUnique({
        where: {
          user_id_organization_id: {
            user_id: data.user_id,
            organization_id: data.organization_id,
          },
        },
      });

      this.logger.log('👤 Final check existing business user:', business_user);
      if (business_user) {
        this.logger.log('🔄 Updating existing business user to inactive');
        await this.prisma.businessUser.update({
          where: {
            business_user_id: business_user.business_user_id,
          },
          data: {
            is_active: false,
          },
        });
      } else {
        this.logger.log('🆕 Creating new business user');
        await this.prisma.businessUser.create({
          data: {
            user_id: data.user_id,
            organization_id: data.organization_id,
            email: data.email,
            is_active: true,
            access_level: 1,
          },
        });
        this.logger.log('✅ Business user created successfully');
      }
    } catch (error) {
      this.logger.error('❌ Business user creation failed:', error.message);
      this.logger.log(
        'ℹ️ No rollback needed - user and organization already created successfully',
      );

      // Just log the error and let it fail gracefully
      // The user and organization have already been created successfully by this point
      throw error;
    }
    // console.log('✅ Business user created successfully.');
  }
}
