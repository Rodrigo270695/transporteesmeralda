export interface LoginCredentials {
    dni: string;
    password: string;
    remember: boolean;
}

export interface LoginFormData extends LoginCredentials {}

export interface AuthUser {
    id: number;
    first_name: string;
    last_name: string;
    dni: string;
    phone: string;
    email: string | null;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: string[];
}

export interface AuthResponse {
    user: AuthUser;
    token?: string;
    message?: string;
}

export interface LoginErrors {
    dni?: string;
    password?: string;
    general?: string;
}

export interface ResetPasswordData {
    email: string;
}

export interface NewPasswordData {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}
