import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FallNotificationDto, CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('fall-detected')
    @ApiOperation({ summary: 'Create fall detection notification' })
    @ApiResponse({ status: 201, description: 'Notification created successfully' })
    async createFallNotification(@Body() fallNotificationDto: FallNotificationDto) {
        return this.notificationsService.createFallNotification(fallNotificationDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get user notifications' })
    @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
    async getNotifications(@Request() req) {
        return this.notificationsService.findAll(req.user._id);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
    async getUnreadCount(@Request() req) {
        const count = await this.notificationsService.getUnreadCount(req.user._id);
        return { count };
    }

    @Post(':id/acknowledge')
    @ApiOperation({ summary: 'Acknowledge notification' })
    @ApiResponse({ status: 200, description: 'Notification acknowledged successfully' })
    async acknowledge(@Param('id') id: string) {
        return this.notificationsService.acknowledge(id);
    }

    @Post(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 200, description: 'Notification marked as read successfully' })
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }
}