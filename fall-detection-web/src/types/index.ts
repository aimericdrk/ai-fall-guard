export interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isActive: boolean;
    isAdmin: boolean;
    deviceTokens: string[];
    fallDetectionEnabled: boolean;
    notificationsEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FallEvent {
    _id: string;
    userId: string;
    confidence: number;
    angle: number;
    velocity: number;
    landmarks: Record<string, any>;
    isAcknowledged: boolean;
    acknowledgedAt?: string;
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
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    _id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, any>;
    status: NotificationStatus;
    isAcknowledged: boolean;
    acknowledgedAt?: string;
    retryCount: number;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    isEmergency: boolean;
    deviceTokens: string[];
    createdAt: string;
    updatedAt: string;
}

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

export interface AuthResponse {
    access_token: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}

export interface FallStats {
    totalFalls: number;
    acknowledgedFalls: number;
    falseAlarms: number;
    avgConfidence: number;
    maxConfidence: number;
    minConfidence: number;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface CreateFallEventDto {
    userId: string;
    confidence: number;
    angle: number;
    velocity: number;
    landmarks?: Record<string, any>;
    location?: {
        latitude: number;
        longitude: number;
    };
    deviceInfo?: {
        deviceId: string;
        deviceType: string;
        appVersion: string;
    };
}