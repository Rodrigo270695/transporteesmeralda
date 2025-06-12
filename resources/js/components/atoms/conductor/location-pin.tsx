import React from 'react';
import { cn } from '@/lib/utils';
import { DriverPointStatus } from '@/types/driver';
import {
    MapPin,
    Navigation,
    Truck,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';

interface LocationPinProps {
    latitude: number;
    longitude: number;
    status?: DriverPointStatus;
    title?: string;
    onClick?: () => void;
    isActive?: boolean;
    isCurrentLocation?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const statusConfig = {
    pendiente: {
        color: 'bg-gray-500',
        icon: Clock,
        pulse: false
    },
    en_ruta: {
        color: 'bg-blue-500',
        icon: Truck,
        pulse: true
    },
    entregado: {
        color: 'bg-green-500',
        icon: CheckCircle,
        pulse: false
    },
    cancelado: {
        color: 'bg-red-500',
        icon: XCircle,
        pulse: false
    },
    reagendado: {
        color: 'bg-yellow-500',
        icon: Clock,
        pulse: false
    }
};

const sizeConfig = {
    sm: {
        pin: 'h-6 w-6',
        icon: 'h-3 w-3',
        pulse: 'h-8 w-8'
    },
    md: {
        pin: 'h-8 w-8',
        icon: 'h-4 w-4',
        pulse: 'h-10 w-10'
    },
    lg: {
        pin: 'h-10 w-10',
        icon: 'h-5 w-5',
        pulse: 'h-12 w-12'
    }
};

export const LocationPin: React.FC<LocationPinProps> = ({
    latitude,
    longitude,
    status,
    title,
    onClick,
    isActive = false,
    isCurrentLocation = false,
    size = 'md',
    className
}) => {
    const sizeStyles = sizeConfig[size];
    const statusStyles = status ? statusConfig[status] : null;

    // Para ubicación actual del conductor
    if (isCurrentLocation) {
        return (
            <div
                className={cn(
                    "relative cursor-pointer transition-all duration-200",
                    onClick && "hover:scale-110",
                    className
                )}
                onClick={onClick}
                title={title || "Tu ubicación actual"}
            >
                {/* Pulso animado */}
                <div className={cn(
                    "absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping",
                    sizeStyles.pulse
                )} />

                {/* Pin principal */}
                <div className={cn(
                    "relative rounded-full bg-blue-600 flex items-center justify-center shadow-lg border-2 border-white",
                    sizeStyles.pin,
                    isActive && "ring-2 ring-blue-300"
                )}>
                    <Navigation className={cn("text-white", sizeStyles.icon)} />
                </div>
            </div>
        );
    }

    // Para puntos de entrega
    const Icon = statusStyles?.icon || MapPin;
    const shouldPulse = statusStyles?.pulse && status === 'en_ruta';

    return (
        <div
            className={cn(
                "relative cursor-pointer transition-all duration-200",
                onClick && "hover:scale-110",
                className
            )}
            onClick={onClick}
            title={title || `${status ? statusConfig[status] : 'Punto'} - Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`}
        >
            {/* Pulso animado para puntos en ruta */}
            {shouldPulse && (
                <div className={cn(
                    "absolute inset-0 rounded-full opacity-30 animate-ping",
                    statusStyles.color,
                    sizeStyles.pulse
                )} />
            )}

            {/* Pin principal */}
            <div className={cn(
                "relative rounded-full flex items-center justify-center shadow-lg border-2 border-white",
                statusStyles?.color || 'bg-gray-500',
                sizeStyles.pin,
                isActive && "ring-2 ring-blue-300"
            )}>
                <Icon className={cn("text-white", sizeStyles.icon)} />
            </div>

            {/* Etiqueta opcional */}
            {title && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {title}
                </div>
            )}
        </div>
    );
};

export default LocationPin;
