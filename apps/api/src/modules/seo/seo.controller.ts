import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { SitemapService } from './sitemap.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('seo')
@Controller()
export class SeoController {
  constructor(private sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  @Public()
  @Header('Content-Type', 'application/xml')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ summary: 'Get XML sitemap' })
  @ApiResponse({ status: 200, description: 'XML sitemap' })
  async getSitemap(@Res() res: Response) {
    const sitemap = await this.sitemapService.generateSitemap();
    res.send(sitemap);
  }

  @Get('sitemap-index.xml')
  @Public()
  @Header('Content-Type', 'application/xml')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ summary: 'Get sitemap index' })
  @ApiResponse({ status: 200, description: 'Sitemap index' })
  async getSitemapIndex(@Res() res: Response) {
    const index = await this.sitemapService.generateSitemapIndex();
    res.send(index);
  }

  @Get('robots.txt')
  @Public()
  @Header('Content-Type', 'text/plain')
  @Header('Cache-Control', 'public, max-age=86400')
  @ApiOperation({ summary: 'Get robots.txt' })
  @ApiResponse({ status: 200, description: 'robots.txt content' })
  getRobotsTxt(@Res() res: Response) {
    const robots = this.sitemapService.generateRobotsTxt();
    res.send(robots);
  }
}
