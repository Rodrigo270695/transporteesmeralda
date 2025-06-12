import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DriverPointStatus } from '@/types/driver';

// Tipo extendido para aceptar tanto estados de puntos como de entregas
type ExtendedStatus = DriverPointStatus | 'programado' | 'en_proceso' | 'completado';
import {
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    Calendar
} from 'lucide-react';

interface StatusBadgeProps {
    status: ExtendedStatus;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline';
    showIcon?: boolean;
    className?: string;
}

const statusConfig = {
    // Estados de puntos de entrega
    pendiente: {
        label: 'Pendiente',
        icon: Clock,
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    en_ruta: {
        label: 'En Ruta',
        icon: Truck,
        variant: 'default' as const,
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    entregado: {
        label: 'Entregado',
        icon: CheckCircle,
        variant: 'default' as const,
        className: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    cancelado: {
        label: 'Cancelado',
        icon: XCircle,
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
    reagendado: {
        label: 'Reagendado',
        icon: Calendar,
        variant: 'outline' as const,
        className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
    },
    // Estados de entregas (compatibilidad)
    programado: {
        label: 'Programado',
        icon: Calendar,
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    en_proceso: {
        label: 'En Proceso',
        icon: Truck,
        variant: 'default' as const,
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    completado: {
        label: 'Completado',
        icon: CheckCircle,
        variant: 'default' as const,
        className: 'bg-green-100 text-green-700 hover:bg-green-200'
    }
};

const sizeConfig = {
    sm: {
        badge: 'px-2 py-1 text-xs',
        icon: 'h-3 w-3'
    },
    md: {
        badge: 'px-3 py-1 text-sm',
        icon: 'h-4 w-4'
    },
    lg: {
        badge: 'px-4 py-2 text-base',
        icon: 'h-5 w-5'
    }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    size = 'md',
    variant = 'default',
    showIcon = true,
    className
}) => {
    const config = statusConfig[status];
    const sizeStyles = sizeConfig[size];

    if (!config) {
        console.warn(`StatusBadge: Estado "${status}" no reconocido`);
        // Fallback para estados no reconocidos
        return (
            <Badge
                variant="outline"
                className={cn(
                    sizeConfig[size].badge,
                    'inline-flex items-center gap-1 font-medium bg-gray-100 text-gray-700',
                    className
                )}
            >
                {status || 'Sin estado'}
            </Badge>
        );
    }

    const Icon = config.icon;

    return (
        <Badge
            variant={variant === 'outline' ? 'outline' : config.variant}
            className={cn(
                sizeStyles.badge,
                variant === 'default' ? config.className : '',
                'inline-flex items-center gap-1 font-medium',
                className
            )}
        >
            {showIcon && <Icon className={sizeStyles.icon} />}
            {config.label}
        </Badge>
    );
};

export default StatusBadge;
