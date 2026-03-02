import { SendOtpType } from 'src/shared/dependencies/communication.pb';

export interface SendOtpRequest {
  user_id: string;
  email: string;
  name: string;
  otp: string;
  type: SendOtpType;
}
