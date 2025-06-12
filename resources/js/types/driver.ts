import { DeliveryPoint } from './delivery-points';
import { User } from './index';

export interface DriverStats {
    total: number;
    pendientes: number;
    en_ruta: number;
    entregados: number;
    cancelados: number;
    monto_total: number;
    monto_cobrado: number;
    progreso: number;
}

export interface DeliveryStats {
    total_points: number;
    completed_points: number;
    pending_points: number;
    in_route_points: number;
    total_to_collect: number;
    total_collected: number;
    progress_percentage: number;
}

export interface DriverDelivery {
    id: number;
    name: string;
    delivery_date: string;
    status: 'programado' | 'en_proceso' | 'completado' | 'cancelado';
    stats: DeliveryStats;
    deliveryPoints?: DeliveryPoint[];
}

export interface DriverDashboardProps {
    deliveries?: {
        data: DriverDelivery[];
        links: any;
        meta: any;
    };
    mobilities?: Mobility[];
    filters?: {
        date: string;
    };
    user?: User;
    message?: string;
}

export interface DriverDeliveryProps {
    delivery?: {
        id: number;
        name: string;
        delivery_date: string;
        status: string;
    };
    points?: DeliveryPoint[];
    stats?: DriverStats;
    payment_methods?: PaymentMethod[];
    user?: User;
}

export interface Mobility {
    id: number;
    license_plate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    conductor_user_id: number;
    created_at: string;
    updated_at: string;
}

export interface PaymentMethod {
    id: number;
    name: string;
}

export interface PointUpdateRequest {
    status: 'en_ruta' | 'entregado' | 'cancelado' | 'reagendado';
    payment_method_id?: number;
    amount_collected?: number;
    payment_image?: string;
    payment_reference?: string;
    payment_notes?: string;
    delivery_image?: string;
    observation?: string;
    customer_rating?: number;
    cancellation_reason?: string;
    current_latitude?: number;
    current_longitude?: number;
}

export interface LocationUpdate {
    latitude: number;
    longitude: number;
}

export interface ImageUpload {
    delivery_point_id: number;
    payment_image?: string;
    delivery_image?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

// Estados específicos del conductor
export type DriverPointStatus = 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado' | 'reagendado';

export interface DriverLocation {
    latitude: number;
    longitude: number;
    timestamp: Date;
}

export interface RouteOptimization {
    originalOrder: number[];
    optimizedOrder: number[];
    totalDistance: number;
    estimatedTime: number;
}

// Props para componentes de conductor
export interface StatusBadgeProps {
    status: DriverPointStatus;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline';
}

export interface LocationPinProps {
    latitude: number;
    longitude: number;
    status?: DriverPointStatus;
    title?: string;
    onClick?: () => void;
    isActive?: boolean;
}

export interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    showPercentage?: boolean;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export interface StatsCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export interface DeliveryCardProps {
    delivery: DriverDelivery;
    onViewDetails: (delivery: DriverDelivery) => void;
    isLoading?: boolean;
}

export interface MapViewProps {
    points: DeliveryPoint[];
    currentLocation?: DriverLocation;
    onPointClick: (point: DeliveryPoint) => void;
    onLocationUpdate?: (location: DriverLocation) => void;
    showRoute?: boolean;
    center?: [number, number];
    zoom?: number;
}

export interface PointFormProps {
    point: DeliveryPoint;
    paymentMethods: PaymentMethod[];
    onSubmit: (data: PointUpdateRequest) => void;
    onCancel: () => void;
    isLoading?: boolean;
}
