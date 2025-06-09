<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentRequest;
use App\Models\Permit;
use App\Models\Mobility;
use Illuminate\Support\Facades\Storage;

class PermitController extends Controller
{
    /**
     * Store or update permit for a mobility
     */
    public function store(DocumentRequest $request, Mobility $mobility)
    {
        $validated = $request->validated();
        $validated['mobility_id'] = $mobility->id;

        // Manejar subida de archivo
        if ($request->hasFile('digital_document')) {
            $file = $request->file('digital_document');
            $filename = 'permit_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/permits', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        // Si ya existe un permiso, lo actualizamos; si no, creamos uno nuevo
        $permit = $mobility->permit;
        if ($permit) {
            // Si hay un archivo anterior y se está subiendo uno nuevo, eliminar el anterior
            if (isset($validated['digital_document']) && $permit->digital_document) {
                Storage::disk('public')->delete($permit->digital_document);
            }
            $permit->update($validated);
            $message = 'Permiso actualizado exitosamente.';
        } else {
            Permit::create($validated);
            $message = 'Permiso registrado exitosamente.';
        }

        return back()->with('success', $message);
    }

    /**
     * Update permit
     */
    public function update(DocumentRequest $request, Mobility $mobility, Permit $permit)
    {
        $validated = $request->validated();

        // Remover digital_document de los datos validados para evitar que se borre si no se sube archivo
        unset($validated['digital_document']);

        // Manejar subida de archivo solo si se proporciona uno nuevo
        if ($request->hasFile('digital_document')) {
            // Eliminar archivo anterior si existe
            if ($permit->digital_document) {
                Storage::disk('public')->delete($permit->digital_document);
            }

            $file = $request->file('digital_document');
            $filename = 'permit_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/permits', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        $permit->update($validated);

        return back()->with('success', 'Permiso actualizado exitosamente.');
    }

    /**
     * Remove permit from storage
     */
    public function destroy(Mobility $mobility)
    {
        if ($mobility->permit) {
            // Eliminar archivo si existe
            if ($mobility->permit->digital_document) {
                Storage::disk('public')->delete($mobility->permit->digital_document);
            }

            $mobility->permit->delete();
            return back()->with('success', 'Permiso eliminado exitosamente.');
        }

        return back()->with('error', 'No se encontró permiso para eliminar.');
    }

    /**
     * View permit document in browser
     */
    public function viewDocument(Mobility $mobility)
    {
        $permit = $mobility->permit;

        if (!$permit || !$permit->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $permit->digital_document);

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
     * Download permit document
     */
    public function downloadDocument(Mobility $mobility)
    {
        $permit = $mobility->permit;

        if (!$permit || !$permit->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $permit->digital_document);

        if (!file_exists($filePath)) {
            abort(404, 'Archivo no encontrado.');
        }

        $fileName = 'Permiso_' . $mobility->name . '_' . $mobility->plate . '.' . pathinfo($permit->digital_document, PATHINFO_EXTENSION);

        return response()->download($filePath, $fileName);
    }
}
