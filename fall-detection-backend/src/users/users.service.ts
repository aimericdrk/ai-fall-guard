import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './models/user.model';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.userModel.findOne({ email: createUserDto.email });
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const user = new this.userModel(createUserDto);
        return user.save();
    }

    async findAll(): Promise<User[]> {
        return this.userModel.find().exec();
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async addDeviceToken(userId: string, deviceToken: string): Promise<User> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (!user.deviceTokens.includes(deviceToken)) {
            user.deviceTokens.push(deviceToken);
            await user.save();
        }

        return user;
    }

    async removeDeviceToken(userId: string, deviceToken: string): Promise<User> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        user.deviceTokens = user.deviceTokens.filter(token => token !== deviceToken);
        await user.save();

        return user;
    }

    async delete(id: string): Promise<void> {
        const result = await this.userModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }
}