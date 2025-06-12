import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/useCamera';
import {
    Camera,
    X,
    RotateCcw,
    FlipHorizontal,
    Check,
    Download
} from 'lucide-react';

interface CameraCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageData: string) => void;
    title?: string;
    subtitle?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
    isOpen,
    onClose,
    onCapture,
    title = 'Capturar Imagen',
    subtitle = 'Toma una foto de la entrega'
}) => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const {
        isSupported,
        isStreaming,
        error,
        startCamera,
        stopCamera,
        captureImage,
        videoRef
    } = useCamera({ facingMode });

    useEffect(() => {
        if (isOpen && isSupported) {
            startCamera().catch(console.error);
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, isSupported, startCamera, stopCamera]);

    useEffect(() => {
        if (!isOpen) {
            setCapturedImage(null);
            stopCamera();
        }
    }, [isOpen, stopCamera]);

    const handleCapture = async () => {
        try {
            const imageData = await captureImage();
            setCapturedImage(imageData);
        } catch (error) {
            console.error('Error al capturar imagen:', error);
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleFlipCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const handleDownload = () => {
        if (capturedImage) {
            const link = document.createElement('a');
            link.href = capturedImage;
            link.download = `entrega-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5" />
                                {title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                {subtitle}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {!isSupported ? (
                        <div className="text-center py-8">
                            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">
                                Cámara no disponible en este dispositivo
                            </p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <Camera className="h-12 w-12 mx-auto mb-4 text-red-400" />
                            <p className="text-red-600 text-sm">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startCamera()}
                                className="mt-4"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reintentar
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Vista previa de la cámara o imagen capturada */}
                            <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                                {capturedImage ? (
                                    <img
                                        src={capturedImage}
                                        alt="Imagen capturada"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        playsInline
                                        muted
                                    />
                                )}

                                {/* Controles superpuestos */}
                                {!capturedImage && isStreaming && (
                                    <div className="absolute top-4 right-4">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleFlipCamera}
                                            className="bg-white/80 hover:bg-white/90"
                                        >
                                            <FlipHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Controles inferiores */}
                            {capturedImage ? (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleRetake}
                                        className="flex-1"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Repetir
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleDownload}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        onClick={handleConfirm}
                                        className="flex-1"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Confirmar
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <Button
                                        onClick={handleCapture}
                                        disabled={!isStreaming}
                                        size="lg"
                                        className="w-20 h-20 rounded-full"
                                    >
                                        <Camera className="h-8 w-8" />
                                    </Button>
                                </div>
                            )}

                            {/* Estado de carga */}
                            {!isStreaming && !capturedImage && !error && (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-600">
                                        Iniciando cámara...
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CameraCapture;
