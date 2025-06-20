<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Delivery;

class UpdateDeliveryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'delivery_date' => ['required', 'date'],
            'template_number' => ['required', 'string', 'max:15'],
            'zone_id' => ['required', 'exists:zones,id'],
            'status' => ['sometimes', 'in:' . Delivery::STATUS_PROGRAMADA . ',' . Delivery::STATUS_CANCELADA],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Validar que la combinación nombre + fecha sea única, ignorando el registro actual
            $delivery = $this->route('delivery');
            $exists = \App\Models\Delivery::where('name', $this->name)
                                        ->where('delivery_date', $this->delivery_date)
                                        ->where('id', '!=', $delivery->id)
                                        ->exists();

            if ($exists) {
                $validator->errors()->add('name', 'Ya existe una entrega con este nombre para la fecha seleccionada.');
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'name.string' => 'El nombre debe ser texto válido.',
            'name.max' => 'El nombre no puede exceder 100 caracteres.',

            'delivery_date.required' => 'La fecha es obligatoria.',
            'delivery_date.date' => 'Debe ser una fecha válida.',
            'template_number.required' => 'El número de plantilla es obligatorio.',
            'template_number.string' => 'El número de plantilla debe ser texto válido.',
            'template_number.max' => 'El número de plantilla no puede exceder 15 caracteres.',
            'zone_id.required' => 'La zona es obligatoria.',
            'zone_id.exists' => 'La zona seleccionada no es válida.',
            'status.in' => 'El estado debe ser Programada o Cancelada.',
        ];
    }
}
