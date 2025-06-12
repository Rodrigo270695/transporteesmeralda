import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    showPercentage?: boolean;
    showNumbers?: boolean;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
    className?: string;
}

const variantConfig = {
    default: {
        track: 'bg-gray-200',
        fill: 'bg-blue-600'
    },
    success: {
        track: 'bg-green-100',
        fill: 'bg-green-600'
    },
    warning: {
        track: 'bg-yellow-100',
        fill: 'bg-yellow-600'
    },
    danger: {
        track: 'bg-red-100',
        fill: 'bg-red-600'
    }
};

const sizeConfig = {
    sm: {
        height: 'h-2',
        text: 'text-xs'
    },
    md: {
        height: 'h-3',
        text: 'text-sm'
    },
    lg: {
        height: 'h-4',
        text: 'text-base'
    }
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
    current,
    total,
    label,
    showPercentage = true,
    showNumbers = false,
    variant = 'default',
    size = 'md',
    animated = false,
    className
}) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const variantStyles = variantConfig[variant];
    const sizeStyles = sizeConfig[size];

    // Determinar variante automática basada en el porcentaje
    const autoVariant = React.useMemo(() => {
        if (variant !== 'default') return variant;

        if (percentage >= 100) return 'success';
        if (percentage >= 75) return 'default';
        if (percentage >= 50) return 'warning';
        return 'danger';
    }, [percentage, variant]);

    const finalVariantStyles = variantConfig[autoVariant];

    return (
        <div className={cn("w-full space-y-2", className)}>
            {/* Header con label y estadísticas */}
            {(label || showPercentage || showNumbers) && (
                <div className="flex items-center justify-between">
                    {label && (
                        <span className={cn(
                            "font-medium text-gray-700",
                            sizeStyles.text
                        )}>
                            {label}
                        </span>
                    )}

                    <div className="flex items-center gap-2">
                        {showNumbers && (
                            <span className={cn(
                                "text-gray-600",
                                sizeStyles.text
                            )}>
                                {current}/{total}
                            </span>
                        )}

                        {showPercentage && (
                            <span className={cn(
                                "font-semibold",
                                sizeStyles.text,
                                autoVariant === 'success' && "text-green-600",
                                autoVariant === 'warning' && "text-yellow-600",
                                autoVariant === 'danger' && "text-red-600",
                                autoVariant === 'default' && "text-blue-600"
                            )}>
                                {percentage}%
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Barra de progreso */}
            <div className={cn(
                "relative w-full rounded-full overflow-hidden",
                finalVariantStyles.track,
                sizeStyles.height
            )}>
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        finalVariantStyles.fill,
                        animated && "animate-pulse"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />

                {/* Líneas de progreso animadas (opcional) */}
                {animated && percentage > 0 && percentage < 100 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
                )}
            </div>

            {/* Información adicional */}
            {total > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Inicio</span>
                    <span>Meta: {total}</span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
