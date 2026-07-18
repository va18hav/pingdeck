export interface User {
    id: string;
    email: string;
    isVerified: boolean;
    createdAt?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: User;
}

export interface VerifySessionResponse {
    success: boolean;
    data: User;
}
