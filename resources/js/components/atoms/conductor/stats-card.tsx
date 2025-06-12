import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    trend?: {
        value: number;
        isPositive: boolean;
    };
    isLoading?: boolean;
    onClick?: () => void;
    className?: string;
}

const variantConfig = {
    default: {
        background: 'bg-white border-gray-200',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        valueColor: 'text-gray-900',
        titleColor: 'text-gray-600'
    },
    success: {
        background: 'bg-green-50 border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        valueColor: 'text-green-900',
        titleColor: 'text-green-700'
    },
    warning: {
        background: 'bg-yellow-50 border-yellow-200',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        valueColor: 'text-yellow-900',
        titleColor: 'text-yellow-700'
    },
    danger: {
        background: 'bg-red-50 border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        valueColor: 'text-red-900',
        titleColor: 'text-red-700'
    },
    info: {
        background: 'bg-blue-50 border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        valueColor: 'text-blue-900',
        titleColor: 'text-blue-700'
    }
};

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    variant = 'default',
    trend,
    isLoading = false,
    onClick,
    className
}) => {
    const variantStyles = variantConfig[variant];
    const isClickable = !!onClick;

    if (isLoading) {
        return (
            <Card className={cn(
                "animate-pulse",
                variantStyles.background,
                className
            )}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-3 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                        <div className="ml-4">
                            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={cn(
                "transition-all duration-200",
                variantStyles.background,
                isClickable && "cursor-pointer hover:shadow-md hover:scale-105",
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                        {/* Título */}
                        <p className={cn(
                            "text-sm font-medium",
                            variantStyles.titleColor
                        )}>
                            {title}
                        </p>

                        {/* Valor principal */}
                        <p className={cn(
                            "text-2xl font-bold",
                            variantStyles.valueColor
                        )}>
                            {value}
                        </p>

                        {/* Subtítulo y tendencia */}
                        <div className="flex items-center gap-2">
                            {subtitle && (
                                <p className="text-xs text-gray-500">
                                    {subtitle}
                                </p>
                            )}

                            {trend && (
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-medium",
                                    trend.isPositive ? "text-green-600" : "text-red-600"
                                )}>
                                    {trend.isPositive ? (
                                        <TrendingUp className="h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3" />
                                    )}
                                    {Math.abs(trend.value)}%
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Icono */}
                    {Icon && (
                        <div className={cn(
                            "p-3 rounded-full",
                            variantStyles.iconBg
                        )}>
                            <Icon className={cn(
                                "h-6 w-6",
                                variantStyles.iconColor
                            )} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default StatsCard;
