import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCardProps } from '@/types/driver';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

const variantConfig = {
    default: {
        card: 'border-gray-200 bg-white',
        title: 'text-gray-700',
        value: 'text-gray-900',
        subtitle: 'text-gray-500'
    },
    success: {
        card: 'border-green-200 bg-green-50',
        title: 'text-green-700',
        value: 'text-green-900',
        subtitle: 'text-green-600'
    },
    warning: {
        card: 'border-yellow-200 bg-yellow-50',
        title: 'text-yellow-700',
        value: 'text-yellow-900',
        subtitle: 'text-yellow-600'
    },
    danger: {
        card: 'border-red-200 bg-red-50',
        title: 'text-red-700',
        value: 'text-red-900',
        subtitle: 'text-red-600'
    },
    info: {
        card: 'border-blue-200 bg-blue-50',
        title: 'text-blue-700',
        value: 'text-blue-900',
        subtitle: 'text-blue-600'
    }
};

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    variant = 'default',
    trend,
    className,
    ...props
}) => {
    const config = variantConfig[variant];

    return (
        <Card className={cn(config.card, className)} {...props}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn('text-sm font-medium', config.title)}>
                    {title}
                </CardTitle>
                {Icon && (
                    <Icon className={cn('h-4 w-4', config.subtitle)} />
                )}
            </CardHeader>
            <CardContent>
                <div className={cn('text-2xl font-bold', config.value)}>
                    {typeof value === 'number' && value > 999
                        ? `${(value / 1000).toFixed(1)}k`
                        : value
                    }
                </div>

                <div className="flex items-center justify-between mt-2">
                    {subtitle && (
                        <p className={cn('text-xs', config.subtitle)}>
                            {subtitle}
                        </p>
                    )}

                    {trend && (
                        <div className={cn(
                            'flex items-center text-xs font-medium',
                            trend.isPositive ? 'text-green-600' : 'text-red-600'
                        )}>
                            {trend.isPositive ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default StatsCard;
