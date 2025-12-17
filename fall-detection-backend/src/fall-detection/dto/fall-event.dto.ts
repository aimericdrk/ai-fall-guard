import { IsNumber, IsObject, IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFallEventDto {
    @ApiProperty({ example: 'user123' })
    @IsString()
    userId: string;

    @ApiProperty({ example: 0.85, minimum: 0, maximum: 1 })
    @IsNumber()
    confidence: number;

    @ApiProperty({ example: 65.5 })
    @IsNumber()
    angle: number;

    @ApiProperty({ example: 3.2 })
    @IsNumber()
    velocity: number;

    @ApiProperty({ type: Object, required: false })
    @IsOptional()
    @IsObject()
    landmarks?: Record<string, any>;

    @ApiProperty({ type: Object, required: false })
    @IsOptional()
    @IsObject()
    location?: {
        latitude: number;
        longitude: number;
    };

    @ApiProperty({ type: Object, required: false })
    @IsOptional()
    @IsObject()
    deviceInfo?: {
        deviceId: string;
        deviceType: string;
        appVersion: string;
    };
}

export class AcknowledgeFallDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    isFalseAlarm: boolean;

    @ApiProperty({ example: 'Person was just sitting down', required: false })
    @IsOptional()
    @IsString()
    falseAlarmReason?: string;
}