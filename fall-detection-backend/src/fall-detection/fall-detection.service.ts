import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FallEvent, FallEventDocument } from './models/fall-event.model';
import { CreateFallEventDto, AcknowledgeFallDto } from './dto/fall-event.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/models/notification.model';

@Injectable()
export class FallDetectionService {
    private readonly logger = new Logger(FallDetectionService.name);

    constructor(
        @InjectModel(FallEvent.name) private fallEventModel: Model<FallEventDocument>,
        private notificationsService: NotificationsService,
    ) { }

    async createFallEvent(createFallEventDto: CreateFallEventDto): Promise<FallEvent> {
        const fallEvent = new this.fallEventModel(createFallEventDto);
        const savedEvent = await fallEvent.save();

        // Create notification
        await this.notificationsService.createFallNotification({
            userId: createFallEventDto.userId,
            type: NotificationType.FALL_DETECTED,
            data: {
                confidence: createFallEventDto.confidence,
                angle: createFallEventDto.angle,
                velocity: createFallEventDto.velocity,
                timestamp: new Date().toISOString(),
            },
        });

        this.logger.log(`Fall event created for user ${createFallEventDto.userId}`);
        return savedEvent;
    }

    async findAll(userId: string): Promise<FallEvent[]> {
        return this.fallEventModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();
    }

    async findOne(id: string): Promise<FallEvent | null> {
        return this.fallEventModel.findById(id).exec();
    }

    async acknowledge(id: string, acknowledgeFallDto: AcknowledgeFallDto): Promise<FallEvent | null> {
        const fallEvent = await this.fallEventModel.findById(id);
        if (!fallEvent) {
            throw new Error('Fall event not found');
        }

        fallEvent.isAcknowledged = true;
        fallEvent.acknowledgedAt = new Date();
        fallEvent.isFalseAlarm = acknowledgeFallDto.isFalseAlarm;
        fallEvent.falseAlarmReason = acknowledgeFallDto.falseAlarmReason;

        return fallEvent.save();
    }

    async getRecentStats(userId: string, days: number = 30): Promise<any> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const pipeline = [
            {
                $match: {
                    userId: userId,
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalFalls: { $sum: 1 },
                    acknowledgedFalls: {
                        $sum: { $cond: ['$isAcknowledged', 1, 0] },
                    },
                    falseAlarms: {
                        $sum: { $cond: ['$isFalseAlarm', 1, 0] },
                    },
                    avgConfidence: { $avg: '$confidence' },
                    maxConfidence: { $max: '$confidence' },
                    minConfidence: { $min: '$confidence' },
                },
            },
        ];

        const results = await this.fallEventModel.aggregate(pipeline).exec();
        return results[0] || {
            totalFalls: 0,
            acknowledgedFalls: 0,
            falseAlarms: 0,
            avgConfidence: 0,
            maxConfidence: 0,
            minConfidence: 0,
        };
    }

    async deleteOldEvents(): Promise<void> {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        await this.fallEventModel.deleteMany({
            createdAt: { $lt: ninetyDaysAgo },
            isAcknowledged: true,
        });
    }
}