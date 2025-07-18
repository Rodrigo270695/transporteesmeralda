import { StatsCard } from '@/components/atoms/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard, Banknote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentMethodStats {
    count: number;
    total: number;
}

interface DailyPaymentsStats {
    by_method: Record<string, PaymentMethodStats>;
    total_amount: number;
    total_deliveries: number;
    date: string;
}

interface DailyPaymentsCardProps {
    stats: DailyPaymentsStats;
}

const paymentIcons: Record<string, any> = {
    'Efectivo': Banknote,
    'Transferencia': CreditCard,
    'Yape': DollarSign,
    'Plin': DollarSign,
    'Tarjeta': CreditCard,
};

export function DailyPaymentsCard({ stats }: DailyPaymentsCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'America/Lima'
        });
    };

    return (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Cobros del Día
                </CardTitle>
                <p className="text-sm text-green-600">{formatDate(stats.date)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total del día */}
                <div className="text-center p-4 bg-white/60 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Total Cobrado</p>
                    <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(stats.total_amount)}
                    </p>
                    <p className="text-xs text-green-500">
                        {stats.total_deliveries} entregas
                    </p>
                </div>

                {/* Desglose por método de pago */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-green-800">Por Método de Pago</h4>
                    {Object.entries(stats.by_method).map(([method, data]) => {
                        const Icon = paymentIcons[method] || DollarSign;
                        return (
                            <div key={method} className="flex items-center justify-between p-2 bg-white/40 rounded border border-green-100">
                                <div className="flex items-center">
                                    <Icon className="h-4 w-4 text-green-600 mr-2" />
                                    <span className="text-sm font-medium text-green-800">{method}</span>
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        {data.count}
                                    </Badge>
                                </div>
                                <span className="text-sm font-bold text-green-700">
                                    {formatCurrency(data.total)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {Object.keys(stats.by_method).length === 0 && (
                    <div className="text-center p-4 text-green-600">
                        <p className="text-sm">No hay cobros registrados hoy</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
