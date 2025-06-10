export interface DeliveryPoint {
    id: number;
    point_name: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    reference?: string;
    client: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        full_name: string;
    };
    seller: {
        id: number;
        name: string;
        phone?: string;
        performance_percentage?: number;
    };
    mobility: {
        id: number;
        plate_number: string;
        brand: string;
        model: string;
        driver_name?: string;
    };
    amount_to_collect: {
        amount: number;
        formatted: string;
    };
    amount_collected: {
        amount: number | null;
        formatted: string | null;
    };
    priority: 'alta' | 'media' | 'baja';
    priority_label: string;
    estimated_delivery_time?: string;
    delivery_instructions?: string;
    route_order: number;
    status: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado' | 'reagendado';
    status_label: string;
    status_color: string;
    can_edit: boolean;
    payment_method?: {
        id: number;
        name: string;
    };
    times: {
        arrival_time?: string;
        departure_time?: string;
        delivered_at?: string;
        delivered_at_human?: string;
        created_at: string;
        updated_at: string;
    };
    observation?: string;
    cancellation_reason?: string;
    customer_rating?: number;
}

export interface Delivery {
    id: number;
    name: string;
    delivery_date: string;
    status: string;
    progress_percentage: number;
    total_amount_to_collect: number;
    total_amount_collected: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
}

export interface Seller {
    id: number;
    name: string;
    phone?: string;
    performance_percentage?: number;
}

export interface Mobility {
    id: number;
    plate_number: string;
    brand: string;
    model: string;
    driver_name?: string;
}

export interface PaymentMethod {
    id: number;
    name: string;
}
