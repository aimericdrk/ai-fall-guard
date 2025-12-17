import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SchemaTypes } from 'mongoose';

export type UserDocument = User & Document;

export interface UserResponse {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isActive: boolean;
    isAdmin: boolean;
    deviceTokens: string[];
    fallDetectionEnabled: boolean;
    emergencyContacts: Types.ObjectId[];
    notificationsEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

@Schema({
    timestamps: true,
    toJSON: {
        transform: (doc: any, ret: any) => {
            const transformed = { ...ret };
            delete transformed.password;
            delete transformed['__v'];
            return transformed;
        },
    },
})
export class User {
    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    _id: Types.ObjectId;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop()
    phoneNumber?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isAdmin: boolean;

    @Prop({ type: [String], default: [] })
    deviceTokens: string[];

    @Prop({ default: false })
    fallDetectionEnabled: boolean;

    @Prop({ type: Types.ObjectId, ref: 'EmergencyContact', default: [] })
    emergencyContacts: Types.ObjectId[];

    @Prop({ default: false })
    notificationsEnabled: boolean;

    toObject: () => UserResponse;
    comparePassword: (password: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (this: UserDocument) {
    if (!this.isModified('password')) return;

    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
});

UserSchema.methods.comparePassword = async function (this: UserDocument, password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};