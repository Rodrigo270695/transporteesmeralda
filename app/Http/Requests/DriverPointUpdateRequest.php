<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DriverPointUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // La autorización se maneja en el controlador
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $rules = [
            'status' => ['required', 'string', 'in:en_ruta,entregado,cancelado,reagendado'],
            'current_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'current_longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];

        // Validaciones específicas según el estado
        switch ($this->status) {
            case 'entregado':
                $rules = array_merge($rules, [
                    'payment_method_id' => ['required', 'exists:payment_methods,id'],
                    'amount_collected' => ['required', 'numeric', 'min:0'],
                    'payment_image' => ['nullable', 'string'], // Base64
                    'payment_reference' => ['nullable', 'string', 'max:50'],
                    'payment_notes' => ['nullable', 'string', 'max:500'],
                    'delivery_image' => ['nullable', 'string'], // Base64
                    'observation' => ['nullable', 'string', 'max:500'],
                    'customer_rating' => ['nullable', 'integer', 'between:1,5'],
                ]);
                break;

            case 'cancelado':
            case 'reagendado':
                $rules['cancellation_reason'] = ['required', 'string', 'max:500'];
                break;
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'status.required' => 'El estado es obligatorio.',
            'status.in' => 'El estado debe ser: en_ruta, entregado, cancelado o reagendado.',
            'payment_method_id.required' => 'Debe seleccionar un método de pago.',
            'payment_method_id.exists' => 'El método de pago seleccionado no es válido.',
            'amount_collected.required' => 'El monto cobrado es obligatorio.',
            'amount_collected.numeric' => 'El monto cobrado debe ser un número.',
            'amount_collected.min' => 'El monto cobrado debe ser mayor o igual a 0.',
            'cancellation_reason.required' => 'La razón de cancelación es obligatoria.',
            'cancellation_reason.max' => 'La razón de cancelación no puede exceder 500 caracteres.',
            'customer_rating.between' => 'La calificación debe estar entre 1 y 5.',
            'current_latitude.between' => 'La latitud debe estar entre -90 y 90.',
            'current_longitude.between' => 'La longitud debe estar entre -180 y 180.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'status' => 'estado',
            'payment_method_id' => 'método de pago',
            'amount_collected' => 'monto cobrado',
            'payment_image' => 'imagen del pago',
            'payment_reference' => 'referencia del pago',
            'payment_notes' => 'notas del pago',
            'delivery_image' => 'imagen de la entrega',
            'observation' => 'observación',
            'customer_rating' => 'calificación del cliente',
            'cancellation_reason' => 'razón de cancelación',
            'current_latitude' => 'latitud actual',
            'current_longitude' => 'longitud actual',
        ];
    }
}
