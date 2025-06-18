<?php

namespace App\Http\Controllers;

use App\Http\Requests\PropertyCardRequest;
use App\Models\PropertyCard;
use App\Models\Mobility;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PropertyCardController extends Controller
{
    /**
     * Store or update Property Card for a mobility
     */
    public function store(PropertyCardRequest $request, Mobility $mobility)
    {
        $validated = $request->validated();
        $validated['mobility_id'] = $mobility->id;

        // Manejar subida de archivo
        if ($request->hasFile('digital_document')) {
            $file = $request->file('digital_document');
            $filename = 'property_card_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/property_card', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        // Si ya existe una tarjeta de propiedad, la actualizamos; si no, creamos una nueva
        $propertyCard = $mobility->propertyCard;
        if ($propertyCard) {
            // Si hay un archivo anterior y se está subiendo uno nuevo, eliminar el anterior
            if (isset($validated['digital_document']) && $propertyCard->digital_document) {
                Storage::disk('public')->delete($propertyCard->digital_document);
            }
            $propertyCard->update($validated);
            $message = 'Tarjeta de propiedad actualizada exitosamente.';
        } else {
            $propertyCard = PropertyCard::create($validated);
            $message = 'Tarjeta de propiedad registrada exitosamente.';
        }

        return back()->with('success', $message);
    }

    /**
     * Update Property Card
     */
    public function update(PropertyCardRequest $request, Mobility $mobility, PropertyCard $propertyCard)
    {
        $validated = $request->validated();

        // Manejar subida de archivo solo si se proporciona uno nuevo
        if ($request->hasFile('digital_document')) {
            // Eliminar archivo anterior si existe
            if ($propertyCard->digital_document) {
                Storage::disk('public')->delete($propertyCard->digital_document);
            }

            $file = $request->file('digital_document');
            $filename = 'property_card_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/property_card', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        $propertyCard->update($validated);

        return back()->with('success', 'Tarjeta de propiedad actualizada exitosamente.');
    }

    /**
     * Remove Property Card from storage
     */
    public function destroy(Mobility $mobility)
    {
        if ($mobility->propertyCard) {
            // Eliminar archivo si existe
            if ($mobility->propertyCard->digital_document) {
                Storage::disk('public')->delete($mobility->propertyCard->digital_document);
            }

            $mobility->propertyCard->delete();
            return back()->with('success', 'Tarjeta de propiedad eliminada exitosamente.');
        }

        return back()->with('error', 'No se encontró tarjeta de propiedad para eliminar.');
    }

    /**
     * View Property Card document in browser
     */
    public function viewDocument(Mobility $mobility)
    {
        $propertyCard = $mobility->propertyCard;

        if (!$propertyCard || !$propertyCard->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $propertyCard->digital_document);

        if (!file_exists($filePath)) {
            abort(404, 'Archivo no encontrado.');
        }

        $mimeType = mime_content_type($filePath);

        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline'
        ]);
    }

    /**
     * Download Property Card document
     */
    public function downloadDocument(Mobility $mobility)
    {
        $propertyCard = $mobility->propertyCard;

        if (!$propertyCard || !$propertyCard->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $propertyCard->digital_document);

        if (!file_exists($filePath)) {
            abort(404, 'Archivo no encontrado.');
        }

        $fileName = 'Tarjeta_Propiedad_' . $mobility->name . '_' . $mobility->plate . '.' . pathinfo($propertyCard->digital_document, PATHINFO_EXTENSION);

        return response()->download($filePath, $fileName);
    }
}
