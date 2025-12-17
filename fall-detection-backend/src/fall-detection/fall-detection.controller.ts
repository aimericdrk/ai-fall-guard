import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FallDetectionService } from './fall-detection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFallEventDto, AcknowledgeFallDto } from './dto/fall-event.dto';

@ApiTags('Fall Detection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fall-detection')
export class FallDetectionController {
    constructor(private readonly fallDetectionService: FallDetectionService) { }

    @Post('events')
    @ApiOperation({ summary: 'Create fall event' })
    @ApiResponse({ status: 201, description: 'Fall event created successfully' })
    async createFallEvent(@Body() createFallEventDto: CreateFallEventDto) {
        return this.fallDetectionService.createFallEvent(createFallEventDto);
    }

    @Get('events')
    @ApiOperation({ summary: 'Get user fall events' })
    @ApiResponse({ status: 200, description: 'Fall events retrieved successfully' })
    async getFallEvents(@Request() req) {
        return this.fallDetectionService.findAll(req.user._id);
    }

    @Get('events/:id')
    @ApiOperation({ summary: 'Get specific fall event' })
    @ApiResponse({ status: 200, description: 'Fall event retrieved successfully' })
    async getFallEvent(@Param('id') id: string) {
        return this.fallDetectionService.findOne(id);
    }

    @Post('events/:id/acknowledge')
    @ApiOperation({ summary: 'Acknowledge fall event' })
    @ApiResponse({ status: 200, description: 'Fall event acknowledged successfully' })
    async acknowledgeFallEvent(@Param('id') id: string, @Body() acknowledgeFallDto: AcknowledgeFallDto) {
        return this.fallDetectionService.acknowledge(id, acknowledgeFallDto);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get fall detection statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    async getStats(@Request() req, @Query('days') days: number = 30) {
        return this.fallDetectionService.getRecentStats(req.user._id, days);
    }
}