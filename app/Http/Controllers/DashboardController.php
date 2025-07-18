<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Mobility;
use App\Models\DeliveryPoint;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Spatie\Permission\Traits\HasRoles;

class DashboardController extends Controller
{
                public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Roles ya cargados en middleware

        // Datos base para todos los usuarios
        $dashboardData = [
            'user' => $user,
        ];

        // Verificar rol del usuario usando la relación de roles
        $userRoles = $user->roles->pluck('name')->toArray();
        $isAdmin = in_array('admin', $userRoles);
        $isConductor = in_array('conductor', $userRoles);

        // 📊 ESTADÍSTICAS PARA TODOS (admin y conductor)
        $dashboardData['documentationStats'] = $this->getDocumentationStats();
        $dashboardData['dailyPayments'] = $this->getDailyPaymentsStats();
        $dashboardData['todayRoutes'] = $this->getTodayRoutesStats();
        $dashboardData['clientRejections'] = $this->getClientRejectionsStats();

        // 👑 ESTADÍSTICAS SOLO PARA ADMIN
        if ($isAdmin) {
            $dashboardData['mobilityStats'] = $this->getMobilityStats();
            $dashboardData['clientsStats'] = $this->getClientsStats();
            $dashboardData['driversStats'] = $this->getDriversStats();
        }

        return Inertia::render('dashboard', $dashboardData);
    }

    /**
     * 📄 Información de documentación de movilidades
     */
    private function getDocumentationStats()
    {
        $total = Mobility::count();
        $withDocuments = Mobility::whereHas('soat')->count();
        $expired = Mobility::whereHas('soat', function($query) {
            $query->where('end_date', '<', Carbon::now('America/Lima'));
        })->count();

        return [
            'total' => $total,
            'with_documents' => $withDocuments,
            'expired' => $expired,
            'percentage' => $total > 0 ? round(($withDocuments / $total) * 100, 1) : 0,
        ];
    }

    /**
     * 💰 Cobro diario por tipo de pago
     */
    private function getDailyPaymentsStats()
    {
        $today = Carbon::today('America/Lima');

        $payments = DeliveryPoint::whereDate('delivered_at', $today)
            ->where('status', 'entregado')
            ->with('paymentMethod')
            ->get()
            ->groupBy(function ($item) {
                return $item->paymentMethod ? $item->paymentMethod->name : 'Sin método';
            })
            ->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'total' => $group->sum('amount_collected')
                ];
            });

        $totalAmount = $payments->sum('total');
        $totalDeliveries = $payments->sum('count');

        return [
            'by_method' => $payments,
            'total_amount' => $totalAmount,
            'total_deliveries' => $totalDeliveries,
            'date' => $today->format('Y-m-d')
        ];
    }

    /**
     * 🛣️ Historial de estados de recorridos hoy
     */
    private function getTodayRoutesStats()
    {
        $today = Carbon::today('America/Lima');

        $routes = DeliveryPoint::whereHas('delivery', function($query) use ($today) {
            $query->whereDate('delivery_date', $today);
        })
        ->select('status', DB::raw('count(*) as count'))
        ->groupBy('status')
        ->get()
        ->pluck('count', 'status');

        return [
            'pendiente' => $routes['pendiente'] ?? 0,
            'en_ruta' => $routes['en_ruta'] ?? 0,
            'entregado' => $routes['entregado'] ?? 0,
            'cancelado' => $routes['cancelado'] ?? 0,
            'reagendado' => $routes['reagendado'] ?? 0,
            'total' => $routes->sum(),
            'date' => $today->format('Y-m-d')
        ];
    }

    /**
     * 📊 Cliente con más rechazos (tablero de barras)
     */
    private function getClientRejectionsStats()
    {
        $rejections = DeliveryPoint::where('status', 'cancelado')
            ->whereNotNull('cancellation_reason')
            ->with('client:id,first_name,last_name,dni')
            ->select('client_user_id', DB::raw('count(*) as rejections_count'))
            ->groupBy('client_user_id')
            ->orderBy('rejections_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'client_name' => $item->client->first_name . ' ' . $item->client->last_name,
                    'client_dni' => $item->client->dni,
                    'rejections_count' => $item->rejections_count
                ];
            });

        return $rejections;
    }

    /**
     * 🚗 Estadísticas de movilidades (SOLO ADMIN)
     */
    private function getMobilityStats()
    {
        $total = Mobility::count();
        $available = Mobility::whereHas('conductor', function($query) {
            // Conductor activo y disponible
            $query->where('created_at', '>', Carbon::now('America/Lima')->subMonths(3));
        })->count();

        return [
            'total' => $total,
            'available' => $available,
            'unavailable' => $total - $available
        ];
    }

    /**
     * 👥 Estadísticas de clientes (SOLO ADMIN)
     */
    private function getClientsStats()
    {
        $totalClients = User::role('cliente')->count();
        $activeClients = User::role('cliente')
            ->whereHas('deliveryPoints', function($query) {
                $query->where('created_at', '>', Carbon::now('America/Lima')->subMonth());
            })
            ->count();

        return [
            'total' => $totalClients,
            'active' => $activeClients,
            'inactive' => $totalClients - $activeClients
        ];
    }

    /**
     * 🚛 Estadísticas de conductores (SOLO ADMIN)
     */
    private function getDriversStats()
    {
        $totalDrivers = User::role('conductor')->count();
        $activeDrivers = User::role('conductor')
            ->whereHas('mobilities', function($query) {
                $query->whereHas('deliveryPoints', function($subQuery) {
                    $subQuery->where('delivered_at', '>', Carbon::now('America/Lima')->subWeek());
                });
            })
            ->count();

        return [
            'total' => $totalDrivers,
            'active' => $activeDrivers,
            'inactive' => $totalDrivers - $activeDrivers
        ];
    }
}
