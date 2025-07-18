import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingDown, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ClientRejection {
    client_name: string;
    client_dni: string;
    rejections_count: number;
}

interface ClientRejectionsChartProps {
    data: ClientRejection[];
}

export function ClientRejectionsChart({ data }: ClientRejectionsChartProps) {
    const maxRejections = Math.max(...data.map(item => item.rejections_count), 1);

    const getPercentage = (count: number) => {
        return Math.round((count / maxRejections) * 100);
    };

    const getColorClass = (count: number) => {
        const percentage = getPercentage(count);
        if (percentage >= 80) return 'bg-red-500';
        if (percentage >= 60) return 'bg-orange-500';
        if (percentage >= 40) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const getTextColorClass = (count: number) => {
        const percentage = getPercentage(count);
        if (percentage >= 80) return 'text-red-700';
        if (percentage >= 60) return 'text-orange-700';
        if (percentage >= 40) return 'text-yellow-700';
        return 'text-blue-700';
    };

    return (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Clientes con Más Rechazos
                </CardTitle>
                <p className="text-sm text-orange-600 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    Puntos cancelados por cliente
                </p>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <div className="space-y-3">
                        {data.map((client, index) => {
                            const percentage = getPercentage(client.rejections_count);
                            const colorClass = getColorClass(client.rejections_count);
                            const textColorClass = getTextColorClass(client.rejections_count);

                            return (
                                <div key={client.client_dni} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center min-w-0 flex-1">
                                            <div className="flex items-center mr-2">
                                                <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white ${colorClass}`}>
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {client.client_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    DNI: {client.client_dni}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <span className={`text-lg font-bold ${textColorClass}`}>
                                                {client.rejections_count}
                                            </span>
                                            <p className="text-xs text-gray-500">rechazos</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Progress
                                            value={percentage}
                                            className="h-2"
                                        />
                                        <div
                                            className={`absolute top-0 left-0 h-2 rounded-full ${colorClass}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center p-6 text-orange-600">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay rechazos registrados</p>
                        <p className="text-xs text-orange-500 mt-1">¡Excelente trabajo del equipo!</p>
                    </div>
                )}

                {data.length > 0 && (
                    <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
                        <p className="text-xs text-orange-700">
                            <strong>Nota:</strong> Los clientes con más rechazos pueden necesitar seguimiento especial
                            para mejorar la experiencia de entrega.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
