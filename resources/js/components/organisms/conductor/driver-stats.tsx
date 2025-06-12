import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, ProgressBar } from '@/components/atoms/conductor';
import { DriverStats as DriverStatsType } from '@/types/driver';
import {
    Package,
    Clock,
    CheckCircle,
    DollarSign,
    TrendingUp,
    Navigation,
    Target
} from 'lucide-react';

interface DriverStatsProps {
    stats: DriverStatsType;
    todayStats?: DriverStatsType;
    className?: string;
}

export const DriverStats: React.FC<DriverStatsProps> = ({
    stats,
    todayStats,
    className
}) => {
    const efficiency = stats.total > 0 ? (stats.entregados / stats.total) * 100 : 0;
    const completionRate = stats.total > 0 ? ((stats.entregados + stats.cancelados) / stats.total) * 100 : 0;
    const collectionRate = stats.monto_total > 0 ? (stats.monto_cobrado / stats.monto_total) * 100 : 0;

    return (
        <div className={className}>
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Total Entregas"
                    value={stats.total}
                    subtitle="Asignadas"
                    icon={Package}
                    variant="info"
                />

                <StatsCard
                    title="Entregadas"
                    value={stats.entregados}
                    subtitle={`${efficiency.toFixed(1)}% de eficiencia`}
                    icon={CheckCircle}
                    variant="success"
                    trend={todayStats ? {
                        value: Math.abs(stats.entregados - (todayStats.entregados || 0)),
                        isPositive: stats.entregados >= (todayStats.entregados || 0)
                    } : undefined}
                />

                <StatsCard
                    title="En Ruta"
                    value={stats.en_ruta}
                    subtitle="En progreso"
                    icon={Navigation}
                    variant="warning"
                />

                <StatsCard
                    title="Monto Cobrado"
                    value={`S/ ${stats.monto_cobrado.toFixed(2)}`}
                    subtitle={`de S/ ${stats.monto_total.toFixed(2)}`}
                    icon={DollarSign}
                    variant="success"
                    trend={{
                        value: Math.round(collectionRate),
                        isPositive: collectionRate > 0
                    }}
                />
            </div>

            {/* Gráficos de progreso */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Progreso de entregas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Progreso de Entregas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ProgressBar
                            current={stats.entregados}
                            total={stats.total}
                            label="Entregas Completadas"
                            showNumbers
                            variant="success"
                        />

                        <ProgressBar
                            current={stats.en_ruta}
                            total={stats.total}
                            label="En Progreso"
                            showNumbers
                            variant="warning"
                        />

                        <ProgressBar
                            current={stats.pendientes}
                            total={stats.total}
                            label="Pendientes"
                            showNumbers
                            variant="default"
                        />
                    </CardContent>
                </Card>

                {/* Métricas de rendimiento */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Métricas de Rendimiento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Tasa de finalización */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Tasa de Finalización</span>
                                    <span className="text-sm text-gray-600">
                                        {completionRate.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(completionRate, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Tasa de cobro */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Tasa de Cobro</span>
                                    <span className="text-sm text-gray-600">
                                        {collectionRate.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(collectionRate, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Eficiencia */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Eficiencia</span>
                                    <span className="text-sm text-gray-600">
                                        {efficiency.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            efficiency >= 80 ? 'bg-green-600' :
                                            efficiency >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                                        }`}
                                        style={{ width: `${Math.min(efficiency, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen detallado */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen Detallado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {stats.entregados}
                            </div>
                            <div className="text-sm text-green-700">Entregados</div>
                        </div>

                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.en_ruta}
                            </div>
                            <div className="text-sm text-blue-700">En Ruta</div>
                        </div>

                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                                {stats.pendientes}
                            </div>
                            <div className="text-sm text-yellow-700">Pendientes</div>
                        </div>

                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">
                                {stats.cancelados}
                            </div>
                            <div className="text-sm text-red-700">Cancelados</div>
                        </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Progreso General:</span>
                                <div className="font-semibold text-lg">
                                    {stats.progreso}%
                                </div>
                            </div>

                            <div>
                                <span className="text-gray-500">Promedio por Entrega:</span>
                                <div className="font-semibold text-lg">
                                    S/ {stats.entregados > 0 ? (stats.monto_cobrado / stats.entregados).toFixed(2) : '0.00'}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DriverStats;
