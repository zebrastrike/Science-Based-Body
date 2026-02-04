import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

interface AuthenticatedRequest {
  user: { id: string; email: string; role: string };
}

class RedeemPointsDto {
  points: number;
}

class CalculateRedemptionDto {
  orderSubtotal: number;
}

@ApiTags('loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get('program')
  @Public()
  @ApiOperation({ summary: 'Get loyalty program information' })
  @ApiResponse({ status: 200, description: 'Program details' })
  getProgramInfo() {
    return this.loyaltyService.getProgramInfo();
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current points balance and tier' })
  @ApiResponse({ status: 200, description: 'Balance and tier info' })
  getBalance(@Request() req: AuthenticatedRequest) {
    return this.loyaltyService.getBalance(req.user.id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get points transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  getHistory(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.loyaltyService.getHistory(req.user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('calculate-redemption')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate max redeemable points for an order' })
  @ApiResponse({ status: 200, description: 'Redemption calculation' })
  async calculateRedemption(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CalculateRedemptionDto,
  ) {
    const balance = await this.loyaltyService.getBalance(req.user.id);
    return this.loyaltyService.getMaxRedeemablePoints(
      balance.currentBalance,
      dto.orderSubtotal,
    );
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem points (typically called during checkout)' })
  @ApiResponse({ status: 200, description: 'Redemption result' })
  @ApiResponse({ status: 400, description: 'Invalid redemption request' })
  async redeemPoints(@Request() req: AuthenticatedRequest, @Body() dto: RedeemPointsDto) {
    return this.loyaltyService.redeemPoints(req.user.id, dto.points);
  }
}
