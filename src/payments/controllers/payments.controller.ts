import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Headers,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new payment' })
    @ApiResponse({ status: 201, description: 'Payment created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid payment data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async createPayment(
        @Body() createPaymentDto: CreatePaymentDto,
        @Request() req,
    ) {
        return this.paymentsService.createPayment(createPaymentDto, req.user.sub);
    }

    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user payments' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getUserPayments(
        @Request() req,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        return this.paymentsService.getUserPayments(req.user.sub, page, limit);
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get payment by ID' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    async getPayment(@Param('id') id: string, @Request() req) {
        return this.paymentsService.getPayment(id, req.user.sub);
    }

    @Post(':id/confirm')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Confirm a payment' })
    async confirmPayment(
        @Param('id') id: string,
        @Body('paymentMethodId') paymentMethodId?: string,
    ) {
        return this.paymentsService.confirmPayment(id, paymentMethodId);
    }

    @Post(':id/refund')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Refund a payment' })
    @ApiResponse({ status: 400, description: 'Payment is not refundable' })
    async refundPayment(
        @Param('id') id: string,
        @Body() refundDto: RefundPaymentDto,
        @Request() req,
    ) {
        return this.paymentsService.refundPayment(id, refundDto, req.user.sub);
    }

    @Delete(':id/cancel')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Cancel a pending payment' })
    async cancelPayment(@Param('id') id: string, @Request() req) {
        return this.paymentsService.cancelPayment(id, req.user.sub);
    }

    // Admin endpoints
    @Get('admin/all')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all payments (Admin only)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiQuery({ name: 'userId', required: false, type: String })
    async getAllPayments(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('status') status?: string,
        @Query('userId') userId?: string,
    ) {
        // Implementation for admin
        return { message: 'Admin endpoint - to be implemented' };
    }
}