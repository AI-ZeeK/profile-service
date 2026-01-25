import { Controller } from '@nestjs/common';
import { SessionService } from './session.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  GetLoginHistoryRequest,
  PROFILE_SERVICE_NAME,
} from 'src/shared/dependencies/profile.pb';

@Controller()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetLoginHistory')
  async getUserSessions(request: GetLoginHistoryRequest) {
    return this.sessionService.getUserSessions(request);
  }
}
