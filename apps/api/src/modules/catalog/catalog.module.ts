import { Module, forwardRef } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { WholesaleController } from './wholesale.controller';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [forwardRef(() => CartModule)],
  controllers: [CatalogController, WholesaleController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
