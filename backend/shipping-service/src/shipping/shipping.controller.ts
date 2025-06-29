import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { CalculateRateDto } from './dto/calculate-rate.dto';
import { TrackShipmentDto } from './dto/track-shipment.dto';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('calculate-rates')
  @ApiOperation({ summary: 'Calculate shipping rates' })
  @ApiResponse({ status: 200, description: 'Shipping rates calculated successfully' })
  async calculateRates(@Body() calculateRateDto: CalculateRateDto) {
    return this.shippingService.calculateRates(calculateRateDto);
  }

  @Post('shipments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new shipment' })
  @ApiResponse({ status: 201, description: 'Shipment created successfully' })
  async createShipment(
    @Body() createShipmentDto: CreateShipmentDto,
    @Request() req: any,
  ) {
    return this.shippingService.createShipment(createShipmentDto, req.user.userId);
  }

  @Get('shipments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shipments' })
  @ApiResponse({ status: 200, description: 'Shipments retrieved successfully' })
  async getShipments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('carrier') carrier?: string,
    @Request() req?: any,
  ) {
    const filters = {
      status,
      carrier,
      userId: req?.user?.role === 'admin' ? undefined : req?.user?.userId,
    };

    return this.shippingService.getShipments(page, limit, filters);
  }

  @Get('shipments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiResponse({ status: 200, description: 'Shipment retrieved successfully' })
  async getShipment(@Param('id') id: string, @Request() req: any) {
    return this.shippingService.getShipmentById(id, req.user.userId, req.user.role);
  }

  @Put('shipments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shipment' })
  @ApiResponse({ status: 200, description: 'Shipment updated successfully' })
  async updateShipment(
    @Param('id') id: string,
    @Body() updateShipmentDto: UpdateShipmentDto,
    @Request() req: any,
  ) {
    return this.shippingService.updateShipment(id, updateShipmentDto, req.user.userId, req.user.role);
  }

  @Delete('shipments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel shipment' })
  @ApiResponse({ status: 200, description: 'Shipment cancelled successfully' })
  async cancelShipment(@Param('id') id: string, @Request() req: any) {
    return this.shippingService.cancelShipment(id, req.user.userId, req.user.role);
  }

  @Post('track')
  @ApiOperation({ summary: 'Track shipment' })
  @ApiResponse({ status: 200, description: 'Shipment tracking information retrieved' })
  async trackShipment(@Body() trackShipmentDto: TrackShipmentDto) {
    return this.shippingService.trackShipment(trackShipmentDto.trackingNumber, trackShipmentDto.carrier);
  }

  @Get('carriers')
  @ApiOperation({ summary: 'Get available carriers' })
  @ApiResponse({ status: 200, description: 'Available carriers retrieved successfully' })
  async getCarriers() {
    return this.shippingService.getAvailableCarriers();
  }

  @Get('carriers/:carrier/services')
  @ApiOperation({ summary: 'Get carrier services' })
  @ApiResponse({ status: 200, description: 'Carrier services retrieved successfully' })
  async getCarrierServices(@Param('carrier') carrier: string) {
    return this.shippingService.getCarrierServices(carrier);
  }

  @Post('labels/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate shipping label' })
  @ApiResponse({ status: 200, description: 'Shipping label generated successfully' })
  async generateLabel(@Param('id') id: string, @Request() req: any) {
    return this.shippingService.generateShippingLabel(id, req.user.userId, req.user.role);
  }

  @Get('zones')
  @ApiOperation({ summary: 'Get shipping zones' })
  @ApiResponse({ status: 200, description: 'Shipping zones retrieved successfully' })
  async getShippingZones() {
    return this.shippingService.getShippingZones();
  }

  @Post('zones')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create shipping zone' })
  @ApiResponse({ status: 201, description: 'Shipping zone created successfully' })
  async createShippingZone(@Body() zoneData: any, @Request() req: any) {
    // Only admin can create shipping zones
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    return this.shippingService.createShippingZone(zoneData);
  }

  @Get('rates/history/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shipping rate history for order' })
  @ApiResponse({ status: 200, description: 'Shipping rate history retrieved successfully' })
  async getRateHistory(@Param('orderId') orderId: string, @Request() req: any) {
    return this.shippingService.getShippingRateHistory(orderId, req.user.userId, req.user.role);
  }

  @Post('webhooks/:carrier')
  @ApiOperation({ summary: 'Handle carrier webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Param('carrier') carrier: string,
    @Body() payload: any,
  ) {
    return this.shippingService.handleCarrierWebhook(carrier, payload);
  }

  @Get('analytics/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shipping analytics summary' })
  @ApiResponse({ status: 200, description: 'Shipping analytics retrieved successfully' })
  async getShippingAnalytics(@Request() req: any) {
    // Only admin can view analytics
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    return this.shippingService.getShippingAnalytics();
  }

  @Get('reports/performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shipping performance report' })
  @ApiResponse({ status: 200, description: 'Shipping performance report retrieved successfully' })
  async getPerformanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    // Only admin can view reports
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    return this.shippingService.getPerformanceReport(new Date(startDate), new Date(endDate));
  }
}
