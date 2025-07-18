import { useState, useCallback } from 'react';
import { config } from '@/lib/config';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    dni: string;
    phone: string;
    email: string;
    full_name: string;
    is_client: boolean;
    is_conductor: boolean;
    is_admin: boolean;
}

interface LoginCredentials {
    dni: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    message: string;
    data?: {
        user: User;
        token: string;
    };
}

interface DeliveryPoint {
    id: number;
    point_name: string;
    address: string;
    latitude: number;
    longitude: number;
    reference: string;
    route_order: number;
    status: string;
    status_color: string;
    priority: string;
    priority_color: string;
    amount_to_collect: number;
    amount_collected: number;
    estimated_delivery_time: string;
    delivery_instructions: string;
    delivery: {
        id: number;
        name: string;
        delivery_date: string;
        template_number: string;
        status: string;
        zone: {
            id: number;
            name: string;
        };
    };
}

interface UseReactNativeApiReturn {
    // Estados
    isLoading: boolean;
    error: string | null;
    user: User | null;
    deliveryPoints: DeliveryPoint[];

    // Métodos de autenticación
    login: (credentials: LoginCredentials) => Promise<LoginResponse>;
    logout: () => Promise<void>;
    getCurrentUser: () => Promise<User>;

    // Métodos de ubicación
    updateLocation: (latitude: number, longitude: number) => Promise<void>;

    // Métodos de entregas
    getTodayDeliveryPoints: () => Promise<DeliveryPoint[]>;

    // Utilidades
    clearError: () => void;
    setToken: (token: string) => void;
    getToken: () => string | null;
}

/**
 * Hook para usar la API móvil desde React Native
 *
 * Este hook maneja la autenticación con tokens bearer y las operaciones
 * específicas para la aplicación móvil de clientes.
 */
export const useReactNativeApi = (): UseReactNativeApiReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
    const [token, setTokenState] = useState<string | null>(null);

    // Función auxiliar para hacer peticiones con token bearer
    const apiRequestWithToken = useCallback(async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        };

        // Agregar token si existe
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${response.status}`);
        }

        return response;
    }, [token]);

    // Limpiar error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Establecer token
    const setToken = useCallback((newToken: string) => {
        setTokenState(newToken);
    }, []);

    // Obtener token
    const getToken = useCallback((): string | null => {
        return token;
    }, [token]);

    // Login
    const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(config.apiUrls.mobile.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data: LoginResponse = await response.json();

            if (data.success && data.data) {
                setUser(data.data.user);
                setToken(data.data.token);
            } else {
                setError(data.message || 'Error en el login');
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [setToken]);

    // Logout
    const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            await apiRequestWithToken(config.apiUrls.mobile.logout, {
                method: 'POST',
            });
        } catch (err) {
            console.warn('Error durante logout:', err);
        } finally {
            setUser(null);
            setToken('');
            setDeliveryPoints([]);
            setIsLoading(false);
        }
    }, [apiRequestWithToken, setToken]);

    // Obtener usuario actual
    const getCurrentUser = useCallback(async (): Promise<User> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiRequestWithToken(config.apiUrls.mobile.me);
            const data = await response.json();

            if (data.success && data.data) {
                setUser(data.data);
                return data.data;
            } else {
                throw new Error(data.message || 'Error obteniendo usuario');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [apiRequestWithToken]);

    // Actualizar ubicación
    const updateLocation = useCallback(async (
        latitude: number,
        longitude: number
    ): Promise<void> => {
        setError(null);

        try {
            await apiRequestWithToken(config.apiUrls.mobile.updateLocation, {
                method: 'POST',
                body: JSON.stringify({ latitude, longitude }),
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error actualizando ubicación';
            setError(errorMessage);
            throw err;
        }
    }, [apiRequestWithToken]);

    // Obtener puntos de entrega de hoy
    const getTodayDeliveryPoints = useCallback(async (): Promise<DeliveryPoint[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiRequestWithToken(config.apiUrls.mobile.deliveryPoints);
            const data = await response.json();

            if (data.success && data.data) {
                setDeliveryPoints(data.data);
                return data.data;
            } else {
                throw new Error(data.message || 'Error obteniendo puntos de entrega');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [apiRequestWithToken]);

    return {
        // Estados
        isLoading,
        error,
        user,
        deliveryPoints,

        // Métodos de autenticación
        login,
        logout,
        getCurrentUser,

        // Métodos de ubicación
        updateLocation,

        // Métodos de entregas
        getTodayDeliveryPoints,

        // Utilidades
        clearError,
        setToken,
        getToken,
    };
};

export default useReactNativeApi;
