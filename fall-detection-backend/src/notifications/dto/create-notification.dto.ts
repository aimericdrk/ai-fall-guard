import { IsEnum, IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationStatus } from '../models/notification.model';

export class CreateNotificationDto {
    @ApiProperty({ example: 'user123' })
    @IsString()
    userId: string;

    @ApiProperty({ enum: NotificationType, example: NotificationType.FALL_DETECTED })
    @IsEnum(NotificationType)
    type: NotificationType;

    @ApiProperty({ example: 'Fall Detected!' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'A fall has been detected. Please check on the person.' })
    @IsString()
    message: string;

    @ApiProperty({ type: Object, required: false })
    @IsOptional()
    @IsObject()
    data?: Record<string, any>;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isEmergency?: boolean;
}

export class FallNotificationDto {
    @ApiProperty({ example: 'user123' })
    @IsString()
    userId: string;

    @ApiProperty({ enum: NotificationType, example: NotificationType.FALL_DETECTED })
    @IsEnum(NotificationType)
    type: NotificationType;

    @ApiProperty({ type: Object })
    @IsObject()
    data: {
        confidence: number;
        angle: number;
        velocity: number;
        timestamp: string;
    };
}