import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async addAddress(userId: string, data: any) {
    return this.prisma.address.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, data: any) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { success: true, message: 'Address deleted' };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Remove default from all other addresses
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this address as default
    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  // ===========================================================================
  // EMAIL CHANGE
  // ===========================================================================

  async changeEmail(userId: string, newEmail: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect password');
    }

    // Check if new email is already taken
    const normalizedEmail = newEmail.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing && existing.id !== userId) {
      throw new BadRequestException('Email is already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return { success: true, message: 'Email updated', user: updated };
  }

  // ===========================================================================
  // PII ENCRYPTION METHODS
  // ===========================================================================

  /**
   * Update sensitive user data with encryption
   * Used for DOB and Government ID which are PII
   */
  async updateSensitiveData(
    userId: string,
    data: {
      dateOfBirth?: string;
      governmentId?: string;
    },
  ) {
    const updateData: any = {};

    if (data.dateOfBirth) {
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
        throw new BadRequestException('Date of birth must be in YYYY-MM-DD format');
      }
      // Encrypt before storing
      updateData.dateOfBirth = this.encryption.encrypt(data.dateOfBirth);
    }

    if (data.governmentId) {
      // Encrypt before storing
      updateData.governmentId = this.encryption.encrypt(data.governmentId);
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No data to update');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return { success: true, message: 'Sensitive data updated' };
  }

  /**
   * Get decrypted sensitive data (for authorized access only)
   */
  async getSensitiveData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        dateOfBirth: true,
        governmentId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      dateOfBirth: user.dateOfBirth ? this.encryption.decrypt(user.dateOfBirth) : null,
      // For government ID, return masked version by default
      governmentIdMasked: user.governmentId
        ? this.encryption.mask(this.encryption.decrypt(user.governmentId), 4)
        : null,
      hasGovernmentId: !!user.governmentId,
    };
  }

  /**
   * Get full decrypted government ID (admin only)
   */
  async getFullGovernmentId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { governmentId: true },
    });

    if (!user || !user.governmentId) {
      return null;
    }

    return this.encryption.decrypt(user.governmentId);
  }

  /**
   * Verify age from encrypted DOB
   */
  async verifyAge(userId: string, minimumAge: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true },
    });

    if (!user || !user.dateOfBirth) {
      return false;
    }

    try {
      const dob = this.encryption.decrypt(user.dateOfBirth);
      const birthDate = new Date(dob);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= minimumAge;
    } catch {
      return false;
    }
  }
}
