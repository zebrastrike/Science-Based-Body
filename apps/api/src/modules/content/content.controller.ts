import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get('hero')
  @Public()
  @ApiOperation({ summary: 'Get hero section with video/image slides' })
  @ApiResponse({ status: 200, description: 'Hero section configuration' })
  getHeroSection() {
    return this.contentService.getHeroSection();
  }

  @Get('homepage')
  @Public()
  @ApiOperation({ summary: 'Get full homepage content configuration' })
  @ApiResponse({ status: 200, description: 'Homepage content blocks' })
  getHomepageContent() {
    return this.contentService.getHomepageContent();
  }

  @Get('announcement')
  @Public()
  @ApiOperation({ summary: 'Get announcement bar content' })
  @ApiResponse({ status: 200, description: 'Announcement bar configuration' })
  getAnnouncementBar() {
    return this.contentService.getAnnouncementBar();
  }

  @Get('banners')
  @Public()
  @ApiOperation({ summary: 'Get promotional banners' })
  @ApiQuery({ name: 'location', required: false, description: 'Filter by location (header, homepage, etc.)' })
  @ApiResponse({ status: 200, description: 'Promotional banners' })
  getPromoBanners(@Query('location') location?: string) {
    return this.contentService.getPromoBanners(location);
  }

  @Get('footer')
  @Public()
  @ApiOperation({ summary: 'Get footer content and navigation' })
  @ApiResponse({ status: 200, description: 'Footer configuration' })
  getFooterContent() {
    return this.contentService.getFooterContent();
  }

  @Get('shop-hero')
  @Public()
  @ApiOperation({ summary: 'Get shop page hero with video' })
  @ApiResponse({ status: 200, description: 'Shop hero configuration' })
  getShopHero() {
    return this.contentService.getShopHero();
  }

  @Get('branding')
  @Public()
  @ApiOperation({ summary: 'Get site branding (logo, favicon, etc.)' })
  @ApiResponse({ status: 200, description: 'Branding configuration' })
  getBranding() {
    return this.contentService.getBranding();
  }

  @Get('pages/partnerships')
  @Public()
  @ApiOperation({ summary: 'Get Brand Partnerships page content' })
  @ApiResponse({ status: 200, description: 'Brand partnerships page content' })
  getBrandPartnerships() {
    return this.contentService.getBrandPartnerships();
  }

  @Get('pages/affiliate')
  @Public()
  @ApiOperation({ summary: 'Get Affiliate Program page content' })
  @ApiResponse({ status: 200, description: 'Affiliate program page content' })
  getAffiliateProgram() {
    return this.contentService.getAffiliateProgram();
  }

  @Get('pages/about')
  @Public()
  @ApiOperation({ summary: 'Get About/Brand Story page content' })
  @ApiResponse({ status: 200, description: 'About page content' })
  getAboutPage() {
    return this.contentService.getAboutPage();
  }
}
