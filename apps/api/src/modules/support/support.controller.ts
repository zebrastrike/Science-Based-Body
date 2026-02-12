import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SupportService } from './support.service';
import { Public } from '../auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

class ContactFormDto {
  name: string;
  email: string;
  subject: string;
  message: string;
  type?: 'general' | 'order' | 'partnership' | 'affiliate' | 'returns';
  orderNumber?: string;
}

class NewsletterDto {
  email: string;
  source?: string;
}

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  // ===========================================================================
  // CONTACT FORM
  // ===========================================================================

  @Post('contact')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Submit contact form' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  submitContactForm(@Body() dto: ContactFormDto, @Req() req: Request) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
    return this.supportService.submitContactForm(dto, ipAddress);
  }

  // ===========================================================================
  // NEWSLETTER
  // ===========================================================================

  @Post('newsletter/subscribe')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiResponse({ status: 200, description: 'Subscribed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  subscribeNewsletter(@Body() dto: NewsletterDto) {
    return this.supportService.subscribeNewsletter(dto);
  }

  @Post('newsletter/unsubscribe')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  unsubscribeNewsletter(@Body() dto: NewsletterDto) {
    return this.supportService.unsubscribeNewsletter(dto.email);
  }

  // ===========================================================================
  // FAQ
  // ===========================================================================

  // ===========================================================================
  // MARKETING POPUP
  // ===========================================================================

  @Get('popup/active')
  @Public()
  @ApiOperation({ summary: 'Get active marketing popup for a page' })
  @ApiQuery({ name: 'page', required: false, description: 'Page identifier (e.g. index.html, shop.html)' })
  @ApiResponse({ status: 200, description: 'Active popup config or null' })
  getActivePopup(@Query('page') page?: string) {
    return this.supportService.getActivePopup(page);
  }

  @Post('popup/:id/convert')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Record popup conversion' })
  recordPopupConversion(@Param('id') id: string) {
    return this.supportService.recordPopupConversion(id);
  }

  // ===========================================================================
  // FAQ
  // ===========================================================================

  @Get('faq')
  @Public()
  @ApiOperation({ summary: 'Get all FAQs grouped by category' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: 'FAQ list' })
  getFAQs(@Query('category') category?: string) {
    // Return static FAQs for now (can switch to database later)
    const faqs = this.supportService.getStaticFAQs();

    if (category) {
      const faqsRecord = faqs.faqs as Record<string, Array<{ question: string; answer: string }>>;
      const filteredFaqs: { categories: string[]; faqs: Record<string, Array<{ question: string; answer: string }>> } = {
        categories: [category],
        faqs: {}
      };
      if (faqsRecord[category]) {
        filteredFaqs.faqs[category] = faqsRecord[category];
      }
      return filteredFaqs;
    }

    return faqs;
  }

  @Get('faq/categories')
  @Public()
  @ApiOperation({ summary: 'Get FAQ categories' })
  @ApiResponse({ status: 200, description: 'FAQ categories' })
  getFAQCategories() {
    return this.supportService.getFAQCategories();
  }

  // ===========================================================================
  // CALLBACK REQUEST
  // ===========================================================================

  @Post('callback')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Request a callback from support' })
  @ApiResponse({ status: 200, description: 'Callback request submitted' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  submitCallbackRequest(
    @Body() body: { name: string; email: string; phone: string; reason: string; type: string },
  ) {
    return this.supportService.submitCallbackRequest(body);
  }
}
