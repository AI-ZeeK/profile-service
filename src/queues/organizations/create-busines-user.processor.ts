import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('business-user')
export class BusinessUserProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationService: OrganizationsService,
  ) {}

  @Process('create_business_user')
  async handleCreateBusinessUser(job: Job) {
    const data = job.data;
    // console.log('👤 Creating business user for:', data.user_id);
    try {
      await this.prisma.businessUser.create({
        data: {
          user_id: data.user_id,
          organization_id: data.organization_id,
          email: data.email,
          is_active: true,
          access_level: 1,
        },
      });
    } catch (error) {
      // console.error(
      //   'Business user failed, rolling back org...',
      //   job.name,
      //   data,
      // );
      await this.organizationService.deleteOrganization(data.organization_id);
      await this.prisma.user.delete({
        where: { user_id: data.user_id },
      });
      // console.error('Error creating business user:', error);
      throw error;
    }
    // console.log('✅ Business user created successfully.');
  }
}
