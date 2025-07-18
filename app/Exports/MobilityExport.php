<?php

namespace App\Exports;

use App\Models\Mobility;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class MobilityExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return Mobility::with([
            'conductor:id,first_name,last_name,email,dni,phone',
            'liquidator',
            'soat',
            'technicalReview',
            'permit',
            'fireExtinguisher',
            'propertyCard'
        ])->get();
    }

    /**
     * @param Mobility $mobility
     */
    public function map($mobility): array
    {
        return [
            $mobility->name,
            $mobility->plate,
            $mobility->conductor->first_name . ' ' . $mobility->conductor->last_name,
            $mobility->conductor->email,
            $mobility->conductor->dni ?? 'N/A',
            $mobility->conductor->phone ?? 'N/A',

            // Liquidador
            $mobility->liquidator ? ($mobility->liquidator->first_name . ' ' . $mobility->liquidator->last_name) : 'No asignado',
            $mobility->liquidator ? $mobility->liquidator->dni : 'N/A',
            $mobility->liquidator ? $mobility->liquidator->phone : 'N/A',

            // SOAT
            $mobility->soat ? 'Sí' : 'No',
            $mobility->soat ? $this->formatDate($mobility->soat->start_date) : 'N/A',
            $mobility->soat ? $this->formatDate($mobility->soat->end_date) : 'N/A',
            $mobility->soat ? $this->getExpirationStatus($mobility->soat->end_date) : 'N/A',

            // Revisión Técnica
            $mobility->technicalReview ? 'Sí' : 'No',
            $mobility->technicalReview ? $this->formatDate($mobility->technicalReview->start_date) : 'N/A',
            $mobility->technicalReview ? $this->formatDate($mobility->technicalReview->end_date) : 'N/A',
            $mobility->technicalReview ? $this->getExpirationStatus($mobility->technicalReview->end_date) : 'N/A',

            // Permiso
            $mobility->permit ? 'Sí' : 'No',
            $mobility->permit ? $this->formatDate($mobility->permit->start_date) : 'N/A',
            $mobility->permit ? $this->formatDate($mobility->permit->end_date) : 'N/A',
            $mobility->permit ? $this->getExpirationStatus($mobility->permit->end_date) : 'N/A',

            // Extintor
            $mobility->fireExtinguisher ? 'Sí' : 'No',
            $mobility->fireExtinguisher ? $this->formatDate($mobility->fireExtinguisher->start_date) : 'N/A',
            $mobility->fireExtinguisher ? $this->formatDate($mobility->fireExtinguisher->end_date) : 'N/A',
            $mobility->fireExtinguisher ? $this->getExpirationStatus($mobility->fireExtinguisher->end_date) : 'N/A',

            // Tarjeta de Propiedad
            $mobility->propertyCard ? 'Sí' : 'No',

            // Información general
            $this->formatDate($mobility->created_at),
            $this->formatDate($mobility->updated_at),
        ];
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Nombre del Vehículo',
            'Placa',
            'Conductor',
            'Email Conductor',
            'DNI Conductor',
            'Teléfono Conductor',

            'Liquidador',
            'DNI Liquidador',
            'Teléfono Liquidador',

            'Tiene SOAT',
            'SOAT Fecha Inicio',
            'SOAT Fecha Vencimiento',
            'SOAT Estado',

            'Tiene Revisión Técnica',
            'Rev. Técnica Fecha Inicio',
            'Rev. Técnica Fecha Vencimiento',
            'Rev. Técnica Estado',

            'Tiene Permiso',
            'Permiso Fecha Inicio',
            'Permiso Fecha Vencimiento',
            'Permiso Estado',

            'Tiene Extintor',
            'Extintor Fecha Inicio',
            'Extintor Fecha Vencimiento',
            'Extintor Estado',

            'Tiene Tarjeta de Propiedad',

            'Fecha de Registro',
            'Última Actualización',
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
                        'argb' => 'FF4F81BD',
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
     * Obtener el estado de expiración
     */
    private function getExpirationStatus($endDate): string
    {
        if (!$endDate) return 'N/A';

        $now = Carbon::now();
        $expiration = Carbon::parse($endDate);

        if ($expiration->isPast()) {
            return 'Vencido';
        } elseif ($expiration->diffInDays($now) <= 60) {
            return 'Por vencer';
        } else {
            return 'Vigente';
        }
    }
}
