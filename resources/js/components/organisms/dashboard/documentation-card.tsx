import { StatsCard } from '@/components/atoms/stats-card';
import { Progress } from '@/components/ui/progress';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface DocumentationStats {
    total: number;
    with_documents: number;
    expired: number;
    percentage: number;
}

interface DocumentationCardProps {
    stats: DocumentationStats;
}

export function DocumentationCard({ stats }: DocumentationCardProps) {
    return (
        <div className="space-y-4">
            {/* Card principal */}
            <StatsCard
                title="Documentación de Movilidades"
                value={`${stats.percentage}%`}
                subtitle={`${stats.with_documents} de ${stats.total} vehículos`}
                icon={FileText}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                valueClassName="text-blue-600"
            />

            {/* Barra de progreso */}
            <div className="px-6 pb-4">
                <Progress value={stats.percentage} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>100%</span>
                </div>
            </div>

            {/* Detalle de documentos */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                        <p className="text-sm font-medium text-green-900">Con Documentos</p>
                        <p className="text-lg font-bold text-green-600">{stats.with_documents}</p>
                    </div>
                </div>

                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <div>
                        <p className="text-sm font-medium text-red-900">Vencidos</p>
                        <p className="text-lg font-bold text-red-600">{stats.expired}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
