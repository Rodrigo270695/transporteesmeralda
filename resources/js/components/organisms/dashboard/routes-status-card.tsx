import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Route, Clock, CheckCircle, XCircle, Calendar, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TodayRoutesStats {
    pendiente: number;
    en_ruta: number;
    entregado: number;
    cancelado: number;
    reagendado: number;
    total: number;
    date: string;
}

interface RoutesStatusCardProps {
    stats: TodayRoutesStats;
}

const statusConfig = {
    pendiente: {
        icon: Clock,
        color: 'gray',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
        label: 'Pendientes'
    },
    en_ruta: {
        icon: Route,
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        label: 'En Ruta'
    },
    entregado: {
        icon: CheckCircle,
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        label: 'Entregados'
    },
    cancelado: {
        icon: XCircle,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        label: 'Cancelados'
    },
    reagendado: {
        icon: RotateCcw,
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        label: 'Reagendados'
    }
};

export function RoutesStatusCard({ stats }: RoutesStatusCardProps) {
    const formatDate = () => {
        return new Date().toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'America/Lima'
        });
    };

    const getPercentage = (value: number) => {
        return stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
    };

    return (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
                <CardTitle className="flex items-center text-purple-800">
                    <Route className="h-5 w-5 mr-2" />
                    Estados de Recorridos Hoy
                </CardTitle>
                <p className="text-sm text-purple-600">{formatDate()}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total del día */}
                <div className="text-center p-4 bg-white/60 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">Total de Puntos</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.total}</p>
                    <p className="text-xs text-purple-500">puntos programados</p>
                </div>

                {/* Desglose por estado */}
                <div className="space-y-3">
                    {Object.entries(statusConfig).map(([status, config]) => {
                        const value = stats[status as keyof TodayRoutesStats] as number;
                        const percentage = getPercentage(value);
                        const Icon = config.icon;

                        return (
                            <div key={status} className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <Icon className={`h-4 w-4 mr-2 ${config.textColor}`} />
                                        <span className={`text-sm font-medium ${config.textColor}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant="secondary" className="text-xs">
                                            {percentage}%
                                        </Badge>
                                        <span className={`text-lg font-bold ${config.textColor}`}>
                                            {value}
                                        </span>
                                    </div>
                                </div>
                                <Progress
                                    value={percentage}
                                    className="h-1.5"
                                />
                            </div>
                        );
                    })}
                </div>

                {stats.total === 0 && (
                    <div className="text-center p-4 text-purple-600">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay recorridos programados para hoy</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
