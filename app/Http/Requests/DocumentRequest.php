<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentRequest extends FormRequest
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
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'digital_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'], // 5MB máximo
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'start_date.required' => 'La fecha de inicio es obligatoria.',
            'start_date.date' => 'La fecha de inicio debe ser una fecha válida.',
            'end_date.required' => 'La fecha de vencimiento es obligatoria.',
            'end_date.date' => 'La fecha de vencimiento debe ser una fecha válida.',
            'end_date.after' => 'La fecha de vencimiento debe ser posterior a la fecha de inicio.',
            'digital_document.file' => 'El documento digital debe ser un archivo válido.',
            'digital_document.mimes' => 'El documento debe ser un archivo PDF, JPG, JPEG, PNG o WEBP.',
            'digital_document.max' => 'El archivo no puede ser mayor a 5MB.',
        ];
    }
}
