import { apiService } from './api';
import { LoginCredentials, AuthResponse, User } from '../types';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/auth/login', credentials);
        if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
        }
        return response;
    },

    async register(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/auth/register', credentials);
        if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
        }
        return response;
    },

    logout() {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    },

    async getProfile(): Promise<User> {
        return apiService.get<User>('/auth/profile');
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    },
};