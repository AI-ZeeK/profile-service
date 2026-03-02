import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { COMMS_QUEUE_ENUM } from '../queue.enum';
import { CommunicationService } from 'src/modules/communication/communication.service';
import { SendOtpRequest } from './request';

@Processor(COMMS_QUEUE_ENUM.BASE)
export class CommsProcessor {
  private logger = new Logger(CommsProcessor.name);

  constructor(private readonly communicationService: CommunicationService) {
    this.logger.log('✅ CommsProcessor initialized');
  }

  @Process(COMMS_QUEUE_ENUM.SEND_OTP)
  async handleCreateWallet(job: Job) {
    try {
      const data: SendOtpRequest = job.data;
      await this.communicationService.sendOtp({
        email: data.email,
        name: data.name,
        otp: data.otp,
        type: data.type,
      });
    } catch (error) {
      this.logger.error('OTP job failed:', error);
      // throw new RpcException(error);
    }
  }
}
