import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    adminId?: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string;
    previousState?: any;
    newState?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  async getByResource(resourceType: string, resourceId: string) {
    return this.prisma.auditLog.findMany({
      where: { resourceType, resourceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByAdmin(adminId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { adminId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
