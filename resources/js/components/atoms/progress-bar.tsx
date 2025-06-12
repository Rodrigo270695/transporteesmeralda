import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ProgressBarProps } from '@/types/driver';
import { cn } from '@/lib/utils';

const variantConfig = {
    default: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
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
    variant = 'default',
    size = 'md',
    className,
    ...props
}) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const config = sizeConfig[size];
    const variantStyle = variantConfig[variant];

    return (
        <div className={cn('w-full space-y-2', className)} {...props}>
            {(label || showPercentage) && (
                <div className="flex items-center justify-between">
                    {label && (
                        <span className={cn('font-medium', config.text, variantStyle)}>
                            {label}
                        </span>
                    )}
                    {showPercentage && (
                        <span className={cn('font-semibold', config.text, variantStyle)}>
                            {current}/{total} ({percentage}%)
                        </span>
                    )}
                </div>
            )}

            <Progress
                value={percentage}
                className={cn(config.height, 'bg-gray-200')}
                indicatorClassName={cn(
                    'transition-all duration-300 ease-in-out',
                    variant === 'success' && 'bg-green-500',
                    variant === 'warning' && 'bg-yellow-500',
                    variant === 'danger' && 'bg-red-500',
                    variant === 'default' && 'bg-primary'
                )}
            />
        </div>
    );
};

export default ProgressBar;
