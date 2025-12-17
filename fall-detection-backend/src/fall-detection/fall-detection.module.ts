import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FallDetectionService } from './fall-detection.service';
import { FallDetectionController } from './fall-detection.controller';
import { FallEvent, FallEventSchema } from './models/fall-event.model';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: FallEvent.name, schema: FallEventSchema }]),
        NotificationsModule,
    ],
    controllers: [FallDetectionController],
    providers: [FallDetectionService],
    exports: [FallDetectionService],
})
export class FallDetectionModule { }