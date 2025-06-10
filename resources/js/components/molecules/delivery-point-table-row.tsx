import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { router } from '@inertiajs/react';
import { MoreHorizontal, Edit2, Trash2, Eye } from 'lucide-react';
import { type DeliveryPoint } from '@/types/delivery-points';

interface Props {
    point: DeliveryPoint;
    deliveryId: number;
    deliveryStatus: string;
    onDelete: (point: DeliveryPoint) => void;
}

export function DeliveryPointTableRow({ point, deliveryId, deliveryStatus, onDelete }: Props) {
    const getStatusBadge = () => {
        const colors = {
            'pendiente': 'bg-gray-100 text-gray-800',
            'en_ruta': 'bg-blue-100 text-blue-800',
            'entregado': 'bg-green-100 text-green-800',
            'cancelado': 'bg-red-100 text-red-800',
            'reagendado': 'bg-yellow-100 text-yellow-800'
        } as const;

        return (
            <Badge variant="outline" className={colors[point.status] || ''}>
                {point.status_label}
            </Badge>
        );
    };

    const getPriorityBadge = () => {
        const colors = {
            'alta': 'bg-red-100 text-red-800',
            'media': 'bg-yellow-100 text-yellow-800',
            'baja': 'bg-green-100 text-green-800'
        } as const;

        return (
            <Badge variant="outline" className={colors[point.priority] || ''}>
                {point.priority === 'alta' ? 'Alta' : point.priority === 'media' ? 'Media' : 'Baja'}
            </Badge>
        );
    };

    return (
        <TableRow className="hover:bg-muted/50">
            <TableCell className="px-6 py-4">
                <div className="font-mono text-sm bg-muted px-2 py-1 rounded w-fit">
                    #{point.route_order}
                </div>
            </TableCell>
            <TableCell className="px-6 py-4">
                <div>
                    <div className="font-medium">{point.point_name}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {point.address}
                    </div>
                </div>
            </TableCell>
            <TableCell className="px-6 py-4">
                <div className="text-sm">{point.client.name}</div>
            </TableCell>
            <TableCell className="px-6 py-4">
                <div className="text-sm">
                    <div className="font-mono">{point.mobility.plate_number}</div>
                    <div className="text-xs text-muted-foreground">
                        {point.mobility.brand} {point.mobility.model}
                    </div>
                </div>
            </TableCell>
            <TableCell className="px-6 py-4">
                <div className="text-sm">
                    <div>{point.amount_to_collect.formatted}</div>
                    {point.amount_collected.formatted && (
                        <div className="text-xs text-green-600">
                            Cobrado: {point.amount_collected.formatted}
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell className="px-6 py-4">
                {getPriorityBadge()}
            </TableCell>
            <TableCell className="px-6 py-4">
                {getStatusBadge()}
            </TableCell>
            <TableCell className="px-6 py-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem
                            onClick={() => router.visit(route('entregas.puntos.show', [deliveryId, point.id]))}
                            className="cursor-pointer"
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                        </DropdownMenuItem>
                        {point.can_edit && (
                            <DropdownMenuItem
                                onClick={() => router.visit(route('entregas.puntos.edit', [deliveryId, point.id]))}
                                className="cursor-pointer"
                            >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                        )}
                        {deliveryStatus === 'borrador' && (
                            <DropdownMenuItem
                                onClick={() => onDelete(point)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}
