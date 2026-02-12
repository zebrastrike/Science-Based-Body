import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailgunService } from '../notifications/mailgun.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailgunService: MailgunService,
  ) {}

  async register(dto: RegisterDto, ipAddress: string) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      // Guest account (no password) — tell frontend to use claim flow
      if (!existingUser.passwordHash) {
        const orderCount = await this.prisma.order.count({
          where: { userId: existingUser.id },
        });
        throw new ConflictException({
          statusCode: 409,
          message: 'Guest account found',
          isGuest: true,
          orderCount,
        });
      }
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        lastLoginIp: ipAddress,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress,
        metadata: { event: 'user_registered' },
      },
    });

    // Send welcome email (non-blocking)
    this.mailgunService
      .sendWelcomeEmail(user.email, user.firstName || 'Researcher')
      .catch((err) => this.logger.error(`Failed to send welcome email: ${err.message}`));

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto, ipAddress: string, userAgent?: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress,
        userAgent,
        metadata: { event: 'user_login' },
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role, type: 'access' },
        { expiresIn: this.config.get('JWT_EXPIRATION', '24h') },
      ),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh' },
        { expiresIn: this.config.get('JWT_REFRESH_EXPIRATION', '7d') },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  // ===========================================================================
  // PASSWORD RESET
  // ===========================================================================

  async forgotPassword(email: string, ipAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return { message: 'If an account exists, a reset link has been sent' };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in a Setting (or you could add a dedicated table)
    await this.prisma.setting.upsert({
      where: { key: `password_reset_${user.id}` },
      create: {
        key: `password_reset_${user.id}`,
        value: JSON.stringify({ hash: resetTokenHash, expiresAt: expiresAt.toISOString() }),
        type: 'json',
        description: 'Password reset token',
      },
      update: {
        value: JSON.stringify({ hash: resetTokenHash, expiresAt: expiresAt.toISOString() }),
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress,
        metadata: { event: 'password_reset_requested' },
      },
    });

    // Send password reset email
    this.mailgunService
      .sendPasswordReset(user.email, user.firstName || 'Customer', resetToken)
      .catch((err) => this.logger.error(`Failed to send password reset email: ${err.message}`));

    return { message: 'If an account exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string, ipAddress: string) {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find the reset token in settings
    const settings = await this.prisma.setting.findMany({
      where: { key: { startsWith: 'password_reset_' } },
    });

    let foundUserId: string | null = null;

    for (const setting of settings) {
      try {
        const data = JSON.parse(setting.value);
        if (data.hash === tokenHash) {
          // Check expiration
          if (new Date(data.expiresAt) < new Date()) {
            throw new BadRequestException('Reset token has expired');
          }
          foundUserId = setting.key.replace('password_reset_', '');
          break;
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        // Invalid JSON, skip
      }
    }

    if (!foundUserId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    const user = await this.prisma.user.update({
      where: { id: foundUserId },
      data: { passwordHash },
      select: { id: true, email: true },
    });

    // Delete the reset token
    await this.prisma.setting.delete({
      where: { key: `password_reset_${foundUserId}` },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress,
        metadata: { event: 'password_reset_completed' },
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress,
        metadata: { event: 'password_changed' },
      },
    });

    return { message: 'Password changed successfully' };
  }

  // ===========================================================================
  // GUEST ACCOUNT CLAIM (convert guest checkout to full account)
  // ===========================================================================

  async claimAccount(
    email: string,
    firstName: string,
    lastName: string,
    phone: string,
    ipAddress: string,
  ) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email');
    }

    // If user already has a password, they should log in instead
    if (user.passwordHash) {
      throw new BadRequestException(
        'This account already has a password. Please log in or use forgot password.',
      );
    }

    // Check that user has orders (confirm they're a real guest checkout customer)
    const orderCount = await this.prisma.order.count({
      where: { userId: user.id },
    });

    if (orderCount === 0) {
      throw new BadRequestException('No orders found for this email');
    }

    // Generate 4-digit code
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store code + submitted info in Settings
    await this.prisma.setting.upsert({
      where: { key: `claim_code_${user.id}` },
      create: {
        key: `claim_code_${user.id}`,
        value: JSON.stringify({
          code,
          firstName,
          lastName,
          phone,
          expiresAt: expiresAt.toISOString(),
          attempts: 0,
        }),
        type: 'json',
        description: 'Account claim verification code',
      },
      update: {
        value: JSON.stringify({
          code,
          firstName,
          lastName,
          phone,
          expiresAt: expiresAt.toISOString(),
          attempts: 0,
        }),
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress,
        metadata: { event: 'claim_account_code_sent' },
      },
    });

    // Send verification code email
    const displayName = firstName || user.firstName || 'Researcher';
    this.mailgunService
      .sendClaimAccountCode(user.email, displayName, code)
      .catch((err) =>
        this.logger.error(`Failed to send claim code email: ${err.message}`),
      );

    return {
      message: 'Verification code sent to your email',
      orderCount,
    };
  }

  async claimAccountVerify(
    email: string,
    code: string,
    password: string,
    ipAddress: string,
  ) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email');
    }

    if (user.passwordHash) {
      throw new BadRequestException('Account already has a password');
    }

    // Look up the stored code
    const setting = await this.prisma.setting.findUnique({
      where: { key: `claim_code_${user.id}` },
    });

    if (!setting) {
      throw new BadRequestException(
        'No verification code found. Please request a new one.',
      );
    }

    const data = JSON.parse(setting.value);

    // Check expiration
    if (new Date(data.expiresAt) < new Date()) {
      await this.prisma.setting.delete({
        where: { key: `claim_code_${user.id}` },
      });
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    // Check attempts (max 5)
    if (data.attempts >= 5) {
      await this.prisma.setting.delete({
        where: { key: `claim_code_${user.id}` },
      });
      throw new BadRequestException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    // Verify code
    if (data.code !== code) {
      // Increment attempts
      data.attempts += 1;
      await this.prisma.setting.update({
        where: { key: `claim_code_${user.id}` },
        data: {
          value: JSON.stringify(data),
        },
      });
      throw new BadRequestException('Invalid verification code');
    }

    // Validate password
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Hash password and update user
    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        firstName: data.firstName || user.firstName,
        lastName: data.lastName || user.lastName,
        phone: data.phone || user.phone,
      },
    });

    // Delete the claim code
    await this.prisma.setting.delete({
      where: { key: `claim_code_${user.id}` },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress,
        metadata: { event: 'guest_account_claimed' },
      },
    });

    return {
      message: 'Account set up successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: data.firstName || user.firstName,
        lastName: data.lastName || user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }
}
