import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ClearUserPushSubscriptionsRequest,
  COMMUNICATION_SERVICE_NAME,
  CommunicationServiceClient,
  protobufPackage,
  SendOtpMailRequest,
} from 'src/shared/dependencies/communication.pb';

@Injectable()
export class CommunicationService {
  private communicationService: CommunicationServiceClient;

  constructor(@Inject(protobufPackage) private client: ClientGrpc) {}

  onModuleInit() {
    this.communicationService =
      this.client.getService<CommunicationServiceClient>(
        COMMUNICATION_SERVICE_NAME,
      );
  }

  async sendOtp(payload: SendOtpMailRequest) {
    return await firstValueFrom(this.communicationService.sendOtpMail(payload));
  }

  async clearUserPushSubscriptions({
    userId,
  }: ClearUserPushSubscriptionsRequest) {
    return await firstValueFrom(
      this.communicationService.clearUserPushSubscriptions({
        userId,
      }),
    );
  }
}
