import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
    FALL_DETECTED = 'FALL_DETECTED',
    FALL_CONFIRMED = 'FALL_CONFIRMED',
    FALL_FALSE_ALARM = 'FALL_FALSE_ALARM',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    EMERGENCY_CONTACT = 'EMERGENCY_CONTACT',
}

export enum NotificationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export interface NotificationResponse {
    _id: string;
    userId: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, any>;
    status: NotificationStatus;
    isAcknowledged: boolean;
    acknowledgedAt?: Date;
    retryCount: number;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    isEmergency: boolean;
    deviceTokens: string[];
    createdAt: Date;
    updatedAt: Date;
}

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
export class Notification {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true, enum: NotificationType })
    type: NotificationType;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ type: Object, default: {} })
    data: Record<string, any>;

    @Prop({ enum: NotificationStatus, default: NotificationStatus.PENDING })
    status: NotificationStatus;

    @Prop({ default: false })
    isAcknowledged: boolean;

    @Prop()
    acknowledgedAt?: Date;

    @Prop({ default: 0 })
    retryCount: number;

    @Prop()
    sentAt?: Date;

    @Prop()
    deliveredAt?: Date;

    @Prop()
    readAt?: Date;

    @Prop({ default: false })
    isEmergency: boolean;

    @Prop({ type: [String], default: [] })
    deviceTokens: string[];

    toObject: () => NotificationResponse;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);