import React from 'react';
import { LocationPinProps, DriverPointStatus } from '@/types/driver';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const statusConfig: Record<DriverPointStatus, {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    shadowColor: string;
}> = {
    pendiente: {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-400',
        shadowColor: 'shadow-yellow-200'
    },
    en_ruta: {
        icon: Navigation,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-400',
        shadowColor: 'shadow-blue-200'
    },
    entregado: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-400',
        shadowColor: 'shadow-green-200'
    },
    cancelado: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-400',
        shadowColor: 'shadow-red-200'
    },
    reagendado: {
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-400',
        shadowColor: 'shadow-orange-200'
    }
};

export const LocationPin: React.FC<LocationPinProps> = ({
    latitude,
    longitude,
    status = 'pendiente',
    title,
    onClick,
    isActive = false,
    className,
    ...props
}) => {
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <div
            className={cn(
                'relative cursor-pointer transform transition-all duration-200 hover:scale-110',
                isActive && 'scale-125 z-10',
                className
            )}
            onClick={onClick}
            title={title || `${latitude}, ${longitude}`}
            {...props}
        >
            {/* Pin Principal */}
            <div className={cn(
                'relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-lg transition-all duration-200',
                config.bgColor,
                config.borderColor,
                config.shadowColor,
                isActive && 'ring-2 ring-offset-2 ring-blue-400',
                onClick && 'hover:shadow-xl'
            )}>
                <StatusIcon className={cn('w-5 h-5', config.color)} />
            </div>

            {/* Punta del pin */}
            <div className={cn(
                'absolute top-9 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent',
                status === 'pendiente' && 'border-t-yellow-400',
                status === 'en_ruta' && 'border-t-blue-400',
                status === 'entregado' && 'border-t-green-400',
                status === 'cancelado' && 'border-t-red-400',
                status === 'reagendado' && 'border-t-orange-400'
            )} />

            {/* Pulso animado para puntos activos */}
            {isActive && (
                <div className={cn(
                    'absolute inset-0 rounded-full animate-ping opacity-75',
                    config.bgColor,
                    config.borderColor,
                    'border-2'
                )} />
            )}

            {/* Tooltip en hover */}
            {title && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {title}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
};

export default LocationPin;
