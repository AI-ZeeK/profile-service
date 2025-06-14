import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

import {
  LoginRequest,
  PROFILE_SERVICE_NAME,
  RegisterRequest,
  SendOtpRequest,
} from 'src/shared/dependencies/profile.pb';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod(PROFILE_SERVICE_NAME, 'login')
  async login(@Payload() data: LoginRequest) {
    return this.authService.login(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'register')
  async register(@Payload() data: RegisterRequest) {
    return this.authService.register(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'sendOtp')
  async sendOtp(@Payload() data: SendOtpRequest) {
    return this.authService.sendOtp(data);
  }
}
