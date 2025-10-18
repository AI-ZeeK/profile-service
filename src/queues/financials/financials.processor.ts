import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FinancialsService } from 'src/modules/financials/financials.service';
import { CreateWalletRequest } from 'src/shared/dependencies/financials.pb';

@Processor('financials')
export class FinancialsProcessor {
  private logger = new Logger(FinancialsProcessor.name);

  constructor(private readonly financialsService: FinancialsService) {
    this.logger.log('✅ FinancialsProcessor initialized');
  }

  @Process('create_wallet')
  async handleCreateWallet(job: Job) {
    this.logger.log('🔥 Processing create_wallet job with ID:', job.id);
    try {
      const data: CreateWalletRequest = job.data;
      this.logger.log('🧱 Creating wallet for user:', data);

      const wallet = await this.financialsService.createWallet({
        entityId: data.entityId,
        entityType: data.entityType,
        currencyCode: data.currencyCode,
      });

      this.logger.log('� Wallet creation result:', wallet);
    } catch (error) {
      console.error('Wallet job failed:', error);
      throw new RpcException(error);
    }
  }
}
