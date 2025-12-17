import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: '+1234567890', required: false })
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    fallDetectionEnabled?: boolean;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    notificationsEnabled?: boolean;
}