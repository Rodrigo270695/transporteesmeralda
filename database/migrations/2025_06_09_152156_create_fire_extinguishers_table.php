<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fire_extinguishers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mobility_id')->constrained('mobilities')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('digital_document')->nullable(); // Archivo digital del certificado
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fire_extinguishers');
    }
};
