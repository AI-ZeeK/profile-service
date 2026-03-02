import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { SharedModule } from './modules/shared.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { QueueModule } from './queues/queue.module';
import { StaffModule } from './staff/staff.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { Env } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'local.env'],
    }),
    BullModule.forRoot({
      redis: Env.REDIS_URL,
    }),
    PrismaModule,
    UserModule,
    SharedModule,
    AuthModule,
    RolesModule,
    QueueModule,
    StaffModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
