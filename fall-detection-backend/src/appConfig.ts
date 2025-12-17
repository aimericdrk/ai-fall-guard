import { registerAs } from '@nestjs/config';
import { configDotenv } from 'dotenv';

export type AppConfig = {
    env?: string;
    port: string;
    jwt: {
        secret: string;
        expiresIn: string;
    }
    mlService: {
        url: string;
    };
    app: {
        name: string;
        version: string;
        description: string;
    };
    security: {
        bcryptSaltRounds: number;
    };
    mongoDbUri?: string;
    mongoDbName?: string;
};

configDotenv();

const env = process.env.NODE_ENV || 'development';

console.log(`Loading for environment: ${env}`);

export const appConfig: AppConfig = {
    env,
    port: process.env.PORT || '3000',
    jwt: {
        secret: process.env.JWT_SECRET
            || 'default_jwt_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
    },
    mlService: {
        url: process.env.ML_SERVICE_URL || 'http://localhost:5000',
    },
    app: {
        name: process.env.APP_NAME || 'Fall Detection Backend',
        version: process.env.APP_VERSION || '1.0.0',
        description: process.env.APP_DESCRIPTION || 'Backend service for Fall Detection Application',
    },
    security: {
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "", 10) || 10,
    },
    mongoDbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    mongoDbName: process.env.MONGODB_DB_NAME || 'fall-detection-db',

};

console.log('App config loaded:', appConfig);
