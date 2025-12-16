import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ManyStaffDetailsRequest,
  StaffDetailsRequest,
} from 'src/shared/dependencies/profile.pb';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async getStaffDetails(data: StaffDetailsRequest) {
    try {
      return this.prisma.staff.findFirst({
        where: { staff_id: data.staffId, company_id: data.companyId },
      });
    } catch (error) {
      throw new RpcException('Failed to retrieve staff by ID');
    }
  }

  async getManyStaffDetails(data: ManyStaffDetailsRequest) {
    try {
      return this.prisma.staff.findMany({
        where: { staff_id: { in: data.staffIds }, company_id: data.companyId },
      });
    } catch (error) {
      throw new RpcException('Failed to retrieve staff details');
    }
  }
}
