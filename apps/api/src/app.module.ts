import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionModule } from './common/encryption.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { FilesModule } from './modules/files/files.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { KycModule } from './modules/kyc/kyc.module';
import { BatchesModule } from './modules/batches/batches.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { CartModule } from './modules/cart/cart.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { ContentModule } from './modules/content/content.module';
import { SupportModule } from './modules/support/support.module';
import { SeoModule } from './modules/seo/seo.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60) * 1000,
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Core
    PrismaModule,
    EncryptionModule,

    // Features
    AuthModule,
    UsersModule,
    CatalogModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    FilesModule,
    ComplianceModule,
    KycModule,
    BatchesModule,
    AdminModule,
    NotificationsModule,
    AuditModule,
    CartModule,
    PoliciesModule,
    LoyaltyModule,
    ContentModule,
    SupportModule,
    SeoModule,
    HealthModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
