import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateWalletRequest,
  FINANCIALS_SERVICE_NAME,
  FinancialsServiceClient,
  protobufPackage,
} from 'src/shared/dependencies/financials.pb';

@Injectable()
export class FinancialsService {
  private financialsService: FinancialsServiceClient;

  constructor(@Inject(protobufPackage) private client: ClientGrpc) {}

  onModuleInit() {
    this.financialsService = this.client.getService<FinancialsServiceClient>(
      FINANCIALS_SERVICE_NAME,
    );
  }

  async createWallet(data: CreateWalletRequest) {
    // console.log('CREATE WALLET SERVICE - Full Request:', JSON.stringify(data));
    return await firstValueFrom(this.financialsService.createWallet(data));
  }
}
