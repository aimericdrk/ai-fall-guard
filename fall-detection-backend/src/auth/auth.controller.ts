import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'User registration' })
    @ApiResponse({ status: 200, description: 'Registration successful', type: AuthResponseDto })
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user profile' })
    getProfile(@Request() req) {
        return req.user;
    }
}