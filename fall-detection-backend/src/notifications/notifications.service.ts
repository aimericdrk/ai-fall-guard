import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationStatus } from './models/notification.model';
import { CreateNotificationDto, FallNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) { }

    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const notification = new this.notificationModel(createNotificationDto);
        return notification.save();
    }

    async createFallNotification(fallNotificationDto: FallNotificationDto): Promise<Notification> {
        const { userId, type, data } = fallNotificationDto;

        const notificationData = {
            userId,
            type,
            title: '🚨 Fall Detected!',
            message: `A fall has been detected with ${Math.round(data.confidence * 100)}% confidence. Body angle: ${Math.round(data.angle)}°, Velocity: ${data.velocity.toFixed(2)} m/s`,
            data,
            isEmergency: true,
            status: NotificationStatus.PENDING,
        };

        const notification = new this.notificationModel(notificationData);
        const savedNotification = await notification.save();

        // Send push notification immediately
        await this.sendPushNotification(savedNotification);

        return savedNotification;
    }

    async findAll(userId: string): Promise<Notification[]> {
        return this.notificationModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();
    }

    async findOne(id: string): Promise<Notification | null> {
        return this.notificationModel.findById(id).exec();
    }

    async acknowledge(id: string): Promise<Notification | null> {
        const notification = await this.notificationModel.findById(id);
        if (!notification) {
            throw new Error('Notification not found');
        }

        notification.isAcknowledged = true;
        notification.acknowledgedAt = new Date();
        notification.status = NotificationStatus.ACKNOWLEDGED;

        return notification.save();
    }

    async markAsRead(id: string): Promise<Notification | null> {
        const notification = await this.notificationModel.findById(id);
        if (!notification) {
            throw new Error('Notification not found');
        }

        notification.readAt = new Date();
        notification.status = NotificationStatus.READ;

        return notification.save();
    }

    private async sendPushNotification(notification: NotificationDocument): Promise<void> {
        try {
            // This would integrate with Firebase Cloud Messaging or similar service
            // For now, we'll log the notification
            this.logger.log(`Sending push notification: ${notification.title}`);

            // Update notification status
            notification.status = NotificationStatus.SENT;
            notification.sentAt = new Date();
            await notification.save();

            // TODO: Implement actual push notification sending
            // Example: await this.firebaseService.sendNotification(notification);

        } catch (error) {
            this.logger.error(`Failed to send push notification: ${error.message}`);
            notification.retryCount += 1;
            await notification.save();
        }
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationModel.countDocuments({
            userId,
            status: { $in: [NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED] },
            isAcknowledged: false,
        });
    }

    async deleteOldNotifications(): Promise<void> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        await this.notificationModel.deleteMany({
            createdAt: { $lt: thirtyDaysAgo },
            isAcknowledged: true,
        });
    }
}