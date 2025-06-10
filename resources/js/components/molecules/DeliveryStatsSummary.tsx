import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface DeliveryStats {
    total: number;
    entregados: number;
    enRuta: number;
    pendientes: number;
    totalAmountToCollect: number;
}

interface DeliveryStatsSummaryProps {
    stats: DeliveryStats;
}

export default function DeliveryStatsSummary({ stats }: DeliveryStatsSummaryProps) {
    const completedPercentage = stats.total > 0 ? Math.round((stats.entregados / stats.total) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Resumen de la Ruta */}
            <Card>
                <CardHeader className="pb-3">
                    <h2 className="text-lg font-semibold">Resumen de la Ruta</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Cards de estadísticas principales */}
                    <div className="grid grid-cols-2 gap-3">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {stats.total}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Total Puntos
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {completedPercentage}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Completado
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Desglose por estado */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm">Entregados</span>
                            </div>
                            <span className="font-medium">{stats.entregados}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm">En Ruta</span>
                            </div>
                            <span className="font-medium">{stats.enRuta}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm">Pendientes</span>
                            </div>
                            <span className="font-medium">{stats.pendientes}</span>
                        </div>
                    </div>

                    {/* Total a cobrar */}
                    <div className="pt-3 border-t">
                        <div className="flex justify-between">
                            <span className="text-sm">Total a cobrar:</span>
                            <span className="font-medium">S/ {stats.totalAmountToCollect.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
