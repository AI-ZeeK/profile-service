import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetLoginHistoryRequest } from 'src/shared/dependencies/profile.pb';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserSessions({
    userId,
    page = 1,
    pageSize = 5,
  }: GetLoginHistoryRequest) {
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    const login_history = await this.prisma.userSession.findMany({
      where: { user_id: userId },
      skip: offset,
      take: limit,
      orderBy: { login_at: 'desc' },
    });

    return {
      login_history,
    };
  }
}
