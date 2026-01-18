import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Helpers } from 'src/lib/helper/helpers';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async activeUsersCount() {
    try {
      const now = new Date();

      // Current period: last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Previous period: 31-60 days ago
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Count active users in current period (last 30 days)
      const currentActiveUsers = await this.prisma.user.count({
        where: {
          is_blocked: false,
          deleted_at: null,
          last_login: {
            gte: thirtyDaysAgo,
            lte: now,
          },
        },
      });

      // Count active users in previous period (31-60 days ago)
      const previousActiveUsers = await this.prisma.user.count({
        where: {
          is_blocked: false,
          deleted_at: null,
          last_login: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      });

      // Calculate trend
      const trend = Helpers.computeTrend(
        currentActiveUsers,
        previousActiveUsers,
      );

      // Generate weekly trend data (at least 3 points, max 8 weeks)
      const trendData: Array<{ name: string; value: number }> = [];
      const dataPoints = 8; // 8 weeks of data

      for (let i = 0; i < dataPoints; i++) {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - i * 7);

        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 30); // 30 days before week end

        // Count active users for this week
        const weekActiveUsers = await this.prisma.user.count({
          where: {
            is_blocked: false,
            deleted_at: null,
            last_login: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        });

        trendData.unshift({
          name: `W${dataPoints - i}`,
          value: weekActiveUsers,
        });
      }

      return {
        count: currentActiveUsers,
        ...trend,
        trend_data: trendData,
      };
    } catch (error) {
      return {
        count: 0,
        percentage: 0,
        trend: 'neutral' as const,
        trend_data: [],
      };
    }
  }

  async dailyActiveUsersMetrics() {
    try {
      // Get total user count for Y-axis scaling
      const totalUsers = await this.prisma.user.count({
        where: {
          is_blocked: false,
          deleted_at: null,
        },
      });

      // Calculate Y-axis sections (4 quartiles)
      const yAxisSections = [
        0,
        Math.ceil(totalUsers * 0.25),
        Math.ceil(totalUsers * 0.5),
        Math.ceil(totalUsers * 0.75),
        totalUsers,
      ];

      // Get last 7 days data
      const now = new Date();
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyData: Array<{
        day: string;
        date: string;
        activeUsers: number;
        isToday: boolean;
      }> = [];

      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i);

        // Set to start of day
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);

        // Set to end of day
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Count users who logged in on this day
        const activeCount = await this.prisma.user.count({
          where: {
            is_blocked: false,
            deleted_at: null,
            last_login: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        });

        dailyData.push({
          day: daysOfWeek[targetDate.getDay()],
          date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD
          activeUsers: activeCount,
          isToday: i === 0,
        });
      }

      return {
        yAxis: {
          max: totalUsers,
          sections: yAxisSections,
          label: 'Active Users',
        },
        xAxis: {
          sections: daysOfWeek,
          label: 'Day of Week',
        },
        data: dailyData,
        summary: {
          totalUsers,
          avgDailyActive:
            Math.round(
              (dailyData.reduce((sum, day) => sum + day.activeUsers, 0) / 7) *
                10,
            ) / 10,
          peakDay: dailyData.reduce((max, day) =>
            day.activeUsers > max.activeUsers ? day : max,
          ),
        },
      };
    } catch (error) {
      return {
        yAxis: { max: 0, sections: [0, 0, 0, 0, 0], label: 'Active Users' },
        xAxis: { label: 'Day of Week' },
        data: [],
        summary: { totalUsers: 0, avgDailyActive: 0, peakDay: null },
      };
    }
  }
}
