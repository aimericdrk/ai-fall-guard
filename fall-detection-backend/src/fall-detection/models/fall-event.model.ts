import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type FallEventDocument = FallEvent & Document;

export interface FallEventResponse {
    _id: string;
    userId: Types.ObjectId;
    confidence: number;
    angle: number;
    velocity: number;
    landmarks: Record<string, any>;
    isAcknowledged: boolean;
    acknowledgedAt?: Date;
    isFalseAlarm: boolean;
    falseAlarmReason?: string;
    imageUrls: string[];
    isActive: boolean;
    location?: {
        latitude: number;
        longitude: number;
    };
    deviceInfo?: {
        deviceId: string;
        deviceType: string;
        appVersion: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Define sub-schemas for complex objects
const LocationSchema = new MongooseSchema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
});

const DeviceInfoSchema = new MongooseSchema({
    deviceId: { type: String, required: true },
    deviceType: { type: String, required: true },
    appVersion: { type: String, required: true },
});

@Schema({
    timestamps: true,
    toJSON: {
        transform: (doc: any, ret: any) => {
            const transformed = { ...ret };
            delete transformed['__v'];
            return transformed;
        },
    },
})
export class FallEvent {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true })
    confidence: number;

    @Prop({ required: true })
    angle: number;

    @Prop({ required: true })
    velocity: number;

    @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
    landmarks: Record<string, any>;

    @Prop({ default: false })
    isAcknowledged: boolean;

    @Prop()
    acknowledgedAt?: Date;

    @Prop({ default: false })
    isFalseAlarm: boolean;

    @Prop()
    falseAlarmReason?: string;

    @Prop({ type: [String], default: [] })
    imageUrls: string[];

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: LocationSchema })
    location?: {
        latitude: number;
        longitude: number;
    };

    @Prop({ type: DeviceInfoSchema })
    deviceInfo?: {
        deviceId: string;
        deviceType: string;
        appVersion: string;
    };

    toObject: () => FallEventResponse;
}

export const FallEventSchema = SchemaFactory.createForClass(FallEvent);