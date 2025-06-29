import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RpcException } from '@nestjs/microservices';
import {
  LoginRequest,
  LogoutRequest,
  PROFILE_SERVICE_NAME,
  RefreshTokenRequest,
  RegisterRequest,
  SendOtpRequest,
  VerifyOtpRequest,
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

  @GrpcMethod(PROFILE_SERVICE_NAME, 'Logout') // user logout
  async logout(data: LogoutRequest) {
    return this.authService.logout(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'SendOtp') // user send otp
  async sendOtp(@Payload() data: SendOtpRequest) {
    return this.authService.sendOtp(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'VerifyOtp') // user verify otp
  async verifyOtp(@Payload() data: VerifyOtpRequest) {
    return this.authService.verifyOtp(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'RefreshToken') // user refresh token
  async refreshToken(@Payload() data: RefreshTokenRequest) {
    return this.authService.refreshToken(data);
  }
}
