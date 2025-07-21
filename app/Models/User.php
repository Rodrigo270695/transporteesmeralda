<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'dni',
        'phone',
        'email',
        'password',
        'address',
        'zone_id',
        'current_latitude',
        'current_longitude',
        'last_location_update',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'current_latitude' => 'decimal:8',
            'current_longitude' => 'decimal:8',
            'last_location_update' => 'datetime',
        ];
    }

    /**
     * Get the name used for authentication.
     */
    public function getAuthIdentifierName()
    {
        return 'dni';
    }

    /**
     * Get the full name attribute.
     */
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Scope to find user by DNI.
     */
    public function scopeByDni($query, $dni)
    {
        return $query->where('dni', $dni);
    }

    /**
     * Get the driver profile associated with the user.
     */
    public function driver()
    {
        return $this->hasOne(Driver::class);
    }

    /**
     * Get the zone associated with the user.
     */
    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    // ═══════════════════════════════════════════════════════════
    // 🔗 RELACIONES ENTREGA - DELIVERY POINTS
    // ═══════════════════════════════════════════════════════════

    /**
     * Relación con puntos de entrega (como cliente)
     */
    public function deliveryPoints()
    {
        return $this->hasMany(DeliveryPoint::class, 'client_user_id');
    }

    /**
     * Puntos de entrega pendientes del cliente
     */
    public function pendingDeliveryPoints()
    {
        return $this->deliveryPoints()->pending();
    }

    /**
     * Puntos de entrega completados del cliente
     */
    public function completedDeliveryPoints()
    {
        return $this->deliveryPoints()->completed();
    }

    /**
     * Relación con movilidades (como conductor)
     */
    public function mobilities()
    {
        return $this->hasMany(Mobility::class, 'conductor_user_id');
    }

    /**
     * Relación con notificaciones del usuario
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 ACCESSORS PARA CLIENTES
    // ═══════════════════════════════════════════════════════════

    /**
     * Get total delivery points for this client
     */
    public function getTotalDeliveryPointsAttribute(): int
    {
        return $this->deliveryPoints()->count();
    }

    /**
     * Get pending delivery points count
     */
    public function getPendingDeliveryPointsCountAttribute(): int
    {
        return $this->pendingDeliveryPoints()->count();
    }

    /**
     * Check if user is a client
     */
    public function getIsClientAttribute(): bool
    {
        return $this->hasRole('cliente');
    }

    /**
     * Check if user is a conductor
     */
    public function getIsConductorAttribute(): bool
    {
        return $this->hasRole('conductor');
    }

    /**
     * Check if user is an admin
     */
    public function getIsAdminAttribute(): bool
    {
        return $this->hasRole('admin');
    }
}
