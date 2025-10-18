import { ORGANIZATION_QUEUES } from '@djengo/proto-contracts';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateCompanyRequest,
  CreateOrganizationRequest,
} from 'src/shared/dependencies/organization.pb';
import { CreateWalletRequest } from 'src/shared/dependencies/financials.pb';

@Injectable()
export class RabbitmqService {
  private logger = new Logger(RabbitmqService.name);
  private organizationClient: ClientProxy;
  private financialsClient: ClientProxy;
  private operationsClient: ClientProxy;

  constructor(
    private prisma: PrismaService,
    @InjectQueue('business-user') private businessUserQueue: Queue,
  ) {
    // Organization service client
    this.organizationClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://admin:mypassword@localhost:5672'],
        queue: ORGANIZATION_QUEUES.BASE,
        queueOptions: { durable: true },
      },
    });

    // Financials service client
    this.financialsClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://admin:mypassword@localhost:5672'],
        queue: 'financials_queue',
        queueOptions: { durable: true },
      },
    });

    // Operations service client
    this.operationsClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://admin:mypassword@localhost:5672'],
        queue: 'operations_queue',
        queueOptions: { durable: true },
      },
    });
  }

  async sendOrganizationCreate(payload: CreateOrganizationRequest) {
    try {
      this.logger.log(
        'Sending organization create message via RabbitMQ',
        payload,
      );
      const result = await this.organizationClient
        .send(ORGANIZATION_QUEUES.CREATE_ACCOUNT, payload)
        .toPromise();

      console.log('Sent organization create message via RabbitMQ', result);
      if (result && result.success) {
        await this.businessUserQueue.add('create_business_user', {
          user_id: payload.creatorId,
          organization_id: result.data.organizationId,
          email: payload.email,
        });
      }

      return result;
    } catch (error) {
      this.prisma.user.delete({
        where: { user_id: payload.creatorId },
      });
      console.error('Error sending organization create message', error);
      throw error;
    }
  }

  async sendCreateWallet(payload: CreateWalletRequest) {
    try {
      this.logger.log('Sending create wallet message via RabbitMQ', payload);

      const result = await this.financialsClient
        .send('create_wallet', payload)
        .toPromise();

      this.logger.log('Wallet creation result via RabbitMQ:', result);
      return result;
    } catch (error) {
      this.logger.error('Error sending create wallet message', error);
      throw error;
    }
  }

  async sendCreateCompanyServices(payload: any) {
    try {
      this.logger.log(
        'Sending create company services message via RabbitMQ',
        payload,
      );

      const result = await this.operationsClient
        .send('create_company_services', payload)
        .toPromise();

      this.logger.log('Company services creation result via RabbitMQ:', result);
      return result;
    } catch (error) {
      this.logger.error('Error sending create company services message', error);
      throw error;
    }
  }
}
