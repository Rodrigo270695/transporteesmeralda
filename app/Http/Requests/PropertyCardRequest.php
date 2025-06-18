<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PropertyCardRequest extends FormRequest
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
            'digital_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'], // 5MB máximo
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'digital_document.file' => 'El documento digital debe ser un archivo válido.',
            'digital_document.mimes' => 'El documento debe ser un archivo PDF, JPG, JPEG, PNG o WEBP.',
            'digital_document.max' => 'El archivo no puede ser mayor a 5MB.',
        ];
    }
}
