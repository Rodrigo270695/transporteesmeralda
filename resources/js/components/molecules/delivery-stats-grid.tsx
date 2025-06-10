import { Card, CardContent } from '@/components/ui/card';

interface Props {
    total: number;
    entregados: number;
    enRuta: number;
    pendientes: number;
}

export function DeliveryStatsGrid({ total, entregados, enRuta, pendientes }: Props) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{entregados}</div>
                    <p className="text-xs text-muted-foreground">Entregados</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{enRuta}</div>
                    <p className="text-xs text-muted-foreground">En Ruta</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-2xl font-bold text-gray-600">{pendientes}</div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-2xl font-bold">{total}</div>
                    <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
            </Card>
        </div>
    );
}
