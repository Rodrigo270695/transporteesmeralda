import React from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusBadgeProps, DriverPointStatus } from '@/types/driver';
import { cn } from '@/lib/utils';

const statusConfig: Record<DriverPointStatus, {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
}> = {
    pendiente: {
        label: 'Pendiente',
        variant: 'outline',
        className: 'border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
    },
    en_ruta: {
        label: 'En Ruta',
        variant: 'default',
        className: 'bg-blue-500 text-white hover:bg-blue-600'
    },
    entregado: {
        label: 'Entregado',
        variant: 'secondary',
        className: 'bg-green-500 text-white hover:bg-green-600'
    },
    cancelado: {
        label: 'Cancelado',
        variant: 'destructive',
        className: 'bg-red-500 text-white hover:bg-red-600'
    },
    reagendado: {
        label: 'Reagendado',
        variant: 'outline',
        className: 'border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100'
    }
};

const sizeConfig = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    size = 'md',
    variant = 'default',
    className,
    ...props
}) => {
    const config = statusConfig[status];
    const sizeClass = sizeConfig[size];

    const badgeClassName = cn(
        sizeClass,
        variant === 'default' ? config.className : '',
        className
    );

    return (
        <Badge
            variant={variant === 'default' ? 'secondary' : config.variant}
            className={badgeClassName}
            {...props}
        >
            {config.label}
        </Badge>
    );
};

export default StatusBadge;
