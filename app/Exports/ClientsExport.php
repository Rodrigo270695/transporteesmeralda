<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class ClientsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return User::role('cliente')
            ->with(['roles'])
            ->select([
                'id',
                'first_name',
                'last_name',
                'dni',
                'phone',
                'email',
                'current_latitude',
                'current_longitude',
                'last_location_update',
                'created_at',
                'updated_at'
            ])
            ->get();
    }

    /**
     * @param User $client
     */
    public function map($client): array
    {
        return [
            $client->id,
            $client->first_name,
            $client->last_name,
            $client->first_name . ' ' . $client->last_name,
            $client->dni ?? 'N/A',
            $client->phone ?? 'N/A',
            $client->email ?? 'N/A',

            // Ubicación
            $client->current_latitude ? 'Sí' : 'No',
            $client->current_latitude ?? 'N/A',
            $client->current_longitude ?? 'N/A',
            $client->last_location_update ? $this->formatDateTime($client->last_location_update) : 'N/A',

            // Estadísticas básicas
            $this->getDeliveryPointsCount($client->id),
            $this->getCompletedDeliveries($client->id),
            $this->getCancelledDeliveries($client->id),
            $this->getTotalAmountPaid($client->id),

            // Fechas del sistema
            $this->formatDate($client->created_at),
            $this->formatDate($client->updated_at),
            $this->getAccountStatus($client),
        ];
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'ID',
            'Nombres',
            'Apellidos',
            'Nombre Completo',
            'DNI',
            'Teléfono',
            'Correo Electrónico',

            'Tiene Ubicación GPS',
            'Latitud',
            'Longitud',
            'Última Actualización GPS',

            'Total Puntos de Entrega',
            'Entregas Completadas',
            'Entregas Canceladas',
            'Total Pagado (S/)',

            'Fecha de Registro',
            'Última Actualización',
            'Estado de Cuenta',
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Estilo para los encabezados
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 12
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => [
                        'argb' => 'FF2563EB',
                    ],
                ],
                'font' => [
                    'color' => [
                        'argb' => 'FFFFFFFF',
                    ],
                    'bold' => true,
                ],
            ],
        ];
    }

    /**
     * Formatear fecha para mostrar
     */
    private function formatDate($date): string
    {
        if (!$date) return 'N/A';

        return Carbon::parse($date)->format('d/m/Y');
    }

    /**
     * Formatear fecha y hora para mostrar
     */
    private function formatDateTime($dateTime): string
    {
        if (!$dateTime) return 'N/A';

        return Carbon::parse($dateTime)->format('d/m/Y H:i');
    }

    /**
     * Obtener el número total de puntos de entrega del cliente
     */
    private function getDeliveryPointsCount($clientId): int
    {
        return \App\Models\DeliveryPoint::where('client_user_id', $clientId)->count();
    }

    /**
     * Obtener el número de entregas completadas
     */
    private function getCompletedDeliveries($clientId): int
    {
        return \App\Models\DeliveryPoint::where('client_user_id', $clientId)
            ->where('status', 'entregado')
            ->count();
    }

    /**
     * Obtener el número de entregas canceladas
     */
    private function getCancelledDeliveries($clientId): int
    {
        return \App\Models\DeliveryPoint::where('client_user_id', $clientId)
            ->where('status', 'cancelado')
            ->count();
    }

    /**
     * Obtener el total pagado por el cliente
     */
    private function getTotalAmountPaid($clientId): float
    {
        return \App\Models\DeliveryPoint::where('client_user_id', $clientId)
            ->where('status', 'entregado')
            ->sum('amount_collected') ?? 0;
    }

    /**
     * Obtener el estado de la cuenta del cliente
     */
    private function getAccountStatus($client): string
    {
        $hasRecentActivity = \App\Models\DeliveryPoint::where('client_user_id', $client->id)
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->exists();

        if ($hasRecentActivity) {
            return 'Activo';
        }

        $hasAnyActivity = \App\Models\DeliveryPoint::where('client_user_id', $client->id)->exists();

        if ($hasAnyActivity) {
            return 'Inactivo';
        }

        return 'Nuevo';
    }
}
