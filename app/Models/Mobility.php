<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mobility extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'plate',
        'conductor_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relación con el conductor (Usuario)
    public function conductor()
    {
        return $this->belongsTo(User::class, 'conductor_user_id');
    }

    // Relación con liquidador
    public function liquidator()
    {
        return $this->hasOne(Liquidator::class);
    }

    // Relación con SOAT
    public function soat()
    {
        return $this->hasOne(Soat::class);
    }

    // Relación con revisión técnica
    public function technicalReview()
    {
        return $this->hasOne(TechnicalReview::class);
    }

    // Relación con permisos
    public function permit()
    {
        return $this->hasOne(Permit::class);
    }

    // Relación con extintor
    public function fireExtinguisher()
    {
        return $this->hasOne(FireExtinguisher::class);
    }
}
