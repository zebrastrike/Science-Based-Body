import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

  // ===========================================================================
  // BLOG ENDPOINTS
  // ===========================================================================

  @Get('blog')
  @Public()
  @ApiOperation({ summary: 'Get all blog posts (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Blog posts list' })
  getBlogPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contentService.getBlogPosts({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      published: true, // Public endpoint only shows published posts
    });
  }

  @Get('blog/:slug')
  @Public()
  @ApiOperation({ summary: 'Get a blog post by slug' })
  @ApiResponse({ status: 200, description: 'Blog post details' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  getBlogPostBySlug(@Param('slug') slug: string) {
    return this.contentService.getBlogPostBySlug(slug);
  }

  // ===========================================================================
  // ADMIN BLOG ENDPOINTS
  // ===========================================================================

  @Get('admin/blog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all blog posts (admin - includes unpublished)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Blog posts list' })
  getAdminBlogPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('published') published?: string,
  ) {
    return this.contentService.getBlogPosts({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      published: published !== undefined ? published === 'true' : undefined,
    });
  }

  @Get('admin/blog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a blog post by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Blog post details' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  getAdminBlogPostById(@Param('id') id: string) {
    return this.contentService.getBlogPostById(id);
  }

  @Post('admin/blog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({ status: 201, description: 'Blog post created' })
  @ApiResponse({ status: 400, description: 'Invalid data or slug already exists' })
  createBlogPost(
    @CurrentUser() user: any,
    @Body() body: {
      title: string;
      slug: string;
      content: string;
      excerpt?: string;
      featuredImage?: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished?: boolean;
    },
  ) {
    return this.contentService.createBlogPost(body, user.id);
  }

  @Put('admin/blog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a blog post' })
  @ApiResponse({ status: 200, description: 'Blog post updated' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  updateBlogPost(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      featuredImage?: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished?: boolean;
    },
  ) {
    return this.contentService.updateBlogPost(id, body, user.id);
  }

  @Delete('admin/blog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a blog post' })
  @ApiResponse({ status: 200, description: 'Blog post deleted' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  deleteBlogPost(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.contentService.deleteBlogPost(id, user.id);
  }
}
