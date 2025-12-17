import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { appConfig } from './appConfig';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FallDetectionModule } from './fall-detection/fall-detection.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: appConfig.mongoDbUri,
        dbName: appConfig.mongoDbName,
        autoIndex: true,
      }),
    }),
    AuthModule,
    UsersModule,
    NotificationsModule,
    FallDetectionModule,
  ],
})
export class AppModule { }