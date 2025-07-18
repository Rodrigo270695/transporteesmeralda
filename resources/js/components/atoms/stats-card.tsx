import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
        label: string;
    };
    className?: string;
    valueClassName?: string;
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    className,
    valueClassName
}: StatsCardProps) {
    return (
        <Card className={cn("", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                )}
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", valueClassName)}>
                    {value}
                </div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {subtitle}
                    </p>
                )}
                {trend && (
                    <div className="flex items-center mt-2">
                        <span className={cn(
                            "text-xs font-medium",
                            trend.isPositive ? "text-green-600" : "text-red-600"
                        )}>
                            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                            {trend.label}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
