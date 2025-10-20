import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import {
  CreateWalletRequest,
  walletEntityTypeEnum,
} from 'src/shared/dependencies/financials.pb';

@Processor('organization')
export class OrganizationProcessor {
  private logger = new Logger(OrganizationProcessor.name);
  constructor(
    private readonly organizationService: OrganizationsService,
    private prisma: PrismaService,
    private readonly rabbitmqService: RabbitmqService,
    @InjectQueue('business-user') private businessUserQueue: Queue,
  ) {}

  @Process('create_organization')
  async handleCreateOrganization(job: Job) {
    try {
      const data = job.data;
      // this.logger.log('🧱 Creating organization for user:', data);

      const organization = await this.organizationService.createOrganization({
        organizationName: data.organizationName || '',
        phoneNumber: data.phoneNumber || '',
        email: data.email || '',
        registrationNumber: data.registrationNumber || '',
        registrationDate: data.registrationDate || '',
        creatorId: data.creatorId,
      });
      // this.logger.log('🏢 Organization creation result:', organization);

      this.logger.log(
        '✅ Organization created, queueing business user...',
        organization,
      );
      if (organization.success) {
        // Use BullMQ for internal business user processing
        await this.businessUserQueue.add('create_business_user', {
          user_id: data.creatorId,
          organization_id: organization.organizationId,
          email: data.email,
        });

        // this.logger.log('✅ Business user queued, creating wallets via RabbitMQ...');

        // Use RabbitMQ for external wallet service calls - queue both simultaneously
        // try {
        //   // const [userWalletResult, orgWalletResult] = await Promise.all([
        //   //   this.rabbitmqService.sendCreateWallet({
        //   //     entityId: data.creatorId,
        //   //     entityType: walletEntityTypeEnum.USER,
        //   //     currencyCode: '',
        //   //   } as CreateWalletRequest),
        //   //   this.rabbitmqService.sendCreateWallet({
        //   //     entityId: organization.organizationId,
        //   //     entityType: walletEntityTypeEnum.ORGANIZATION,
        //   //     currencyCode: '',
        //   //   } as CreateWalletRequest),
        //   // ]);

        //   this.logger.log(
        //     '🧱 User wallet created via RabbitMQ:',
        //     userWalletResult,
        //   );
        //   this.logger.log(
        //     '🧱 Organization wallet created via RabbitMQ:',
        //     orgWalletResult,
        //   );
        // } catch (walletError) {
        //   this.logger.error(
        //     'Failed to create wallets via RabbitMQ:',
        //     walletError,
        //   );
        //   // Note: We might want to implement retry logic or compensation here
        // }

        // this.logger.log('✅ Wallets processed via RabbitMQ');
      } else {
        this.logger.error('Organization creation failed:', organization);

        this.prisma.user.delete({
          where: { user_id: job.data.creatorId },
        });
        // console.log('❌ Organization creation failed:', organization);
        throw new RpcException('Organization creation failed');
      }
    } catch (error) {
      this.logger.error('Organization job failed:', error);
      await this.prisma.user.delete({
        where: { user_id: job.data.creatorId },
      });
      // console.error('Organization job failed:', error);
      throw new RpcException(error);
    }
  }
}
