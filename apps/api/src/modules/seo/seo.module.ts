import { Module } from '@nestjs/common';
import { SeoController } from './seo.controller';
import { SitemapService } from './sitemap.service';

@Module({
  controllers: [SeoController],
  providers: [SitemapService],
  exports: [SitemapService],
})
export class SeoModule {}
