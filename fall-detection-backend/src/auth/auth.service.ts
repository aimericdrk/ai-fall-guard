import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDocument, UserResponse } from '../users/models/user.model';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<UserResponse | null> {
        const user = await this.usersService.findByEmail(email);
        if (user && await user.comparePassword(password)) {
            return user.toObject();
        }
        return null;
    }

    async register(registerDto: any): Promise<AuthResponseDto> {
        const user = await this.usersService.create(registerDto);
        if (!user) {
            throw new UnauthorizedException('Registration failed');
        }

        const payload = { email: user.email, sub: user._id };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { email: user.email, sub: user._id };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async validateToken(token: string): Promise<any> {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}