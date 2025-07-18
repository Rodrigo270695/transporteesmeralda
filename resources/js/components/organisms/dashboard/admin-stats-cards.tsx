import { StatsCard } from '@/components/atoms/stats-card';
import { Car, Users, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface MobilityStats {
    total: number;
    available: number;
    unavailable: number;
}

interface ClientsStats {
    total: number;
    active: number;
    inactive: number;
}

interface DriversStats {
    total: number;
    active: number;
    inactive: number;
}

interface AdminStatsCardsProps {
    mobilityStats: MobilityStats;
    clientsStats: ClientsStats;
    driversStats: DriversStats;
}

export function AdminStatsCards({ mobilityStats, clientsStats, driversStats }: AdminStatsCardsProps) {
    const mobilityAvailablePercentage = mobilityStats.total > 0
        ? Math.round((mobilityStats.available / mobilityStats.total) * 100)
        : 0;

    const clientsActivePercentage = clientsStats.total > 0
        ? Math.round((clientsStats.active / clientsStats.total) * 100)
        : 0;

    const driversActivePercentage = driversStats.total > 0
        ? Math.round((driversStats.active / driversStats.total) * 100)
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Movilidades Disponibles */}
            <StatsCard
                title="Movilidades Disponibles"
                value={mobilityStats.available}
                subtitle={`${mobilityStats.total} total registradas`}
                icon={Car}
                trend={{
                    value: mobilityAvailablePercentage,
                    isPositive: mobilityAvailablePercentage >= 70,
                    label: "disponibilidad"
                }}
                className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200"
                valueClassName="text-cyan-600"
            />

            {/* Clientes */}
            <StatsCard
                title="Clientes Registrados"
                value={clientsStats.total}
                subtitle={`${clientsStats.active} activos este mes`}
                icon={Users}
                trend={{
                    value: clientsActivePercentage,
                    isPositive: clientsActivePercentage >= 50,
                    label: "actividad"
                }}
                className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200"
                valueClassName="text-emerald-600"
            />

            {/* Conductores */}
            <StatsCard
                title="Conductores Activos"
                value={driversStats.active}
                subtitle={`${driversStats.total} total disponibles`}
                icon={UserCheck}
                trend={{
                    value: driversActivePercentage,
                    isPositive: driversActivePercentage >= 60,
                    label: "en servicio"
                }}
                className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200"
                valueClassName="text-violet-600"
            />
        </div>
    );
}
