import { Controller } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { GrpcMethod } from '@nestjs/microservices/decorators/message-pattern.decorator';
import { PROFILE_SERVICE_NAME } from 'src/shared/dependencies/profile.pb';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @GrpcMethod(PROFILE_SERVICE_NAME, 'DailyActiveUsersAnalytics')
  async dailyActiveUsersMetrics() {
    return this.analyticsService.dailyActiveUsersMetrics();
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'ActiveUsersCount')
  async activeUsersCount() {
    return this.analyticsService.activeUsersCount();
  }
}
