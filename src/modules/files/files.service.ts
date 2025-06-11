import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateOrUpdateFileRequest,
  FILES_SERVICE_NAME,
  FilesServiceClient,
  protobufPackage,
  VerifyFileRequest,
} from 'src/shared/dependencies/files.pb';

@Injectable()
export class FilesService {
  private filesService: FilesServiceClient;

  constructor(@Inject(protobufPackage) private client: ClientGrpc) {}

  onModuleInit() {
    this.filesService =
      this.client.getService<FilesServiceClient>(FILES_SERVICE_NAME);
  }

  public async verifyFile(payload: VerifyFileRequest) {
    return await firstValueFrom(this.filesService.verifyFile(payload));
  }

  public async createOrUpdateFile(payload: CreateOrUpdateFileRequest) {
    return await firstValueFrom(this.filesService.createOrUpdateFile(payload));
  }
}
