import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RpcException } from '@nestjs/microservices';
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
  async login(data: LoginRequest) {
    console.log('LOGIN CONTROLLER - Full Request:', JSON.stringify(data));
    return this.authService.login(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'Register')
  async register(data: RegisterRequest) {
    return this.authService.register(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'sendOtp')
  async sendOtp(@Payload() data: SendOtpRequest) {
    return this.authService.sendOtp(data);
  }
}
