import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ADDRESS_SERVICE_NAME,
  AddressServiceClient,
  CreateAddressRequest,
  protobufPackage,
  VerifyAddressRequest,
} from 'src/shared/dependencies/address.pb';

@Injectable()
export class AddressService implements OnModuleInit {
  private addressService: AddressServiceClient;

  constructor(@Inject(protobufPackage) private client: ClientGrpc) {}

  onModuleInit() {
    this.addressService =
      this.client.getService<AddressServiceClient>(ADDRESS_SERVICE_NAME);
  }

  public async verifyAddress(payload: VerifyAddressRequest) {
    return await firstValueFrom(this.addressService.verifyAddress(payload));
  }

  public async createOrUpdateAddress(payload: CreateAddressRequest) {
    return await firstValueFrom(
      this.addressService.createOrUpdateAddress(payload),
    );
  }
}
