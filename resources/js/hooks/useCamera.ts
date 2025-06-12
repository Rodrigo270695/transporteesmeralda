import { useState, useRef, useCallback } from 'react';

interface CameraOptions {
    facingMode?: 'user' | 'environment';
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
}

interface UseCameraReturn {
    isSupported: boolean;
    isStreaming: boolean;
    error: string | null;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    captureImage: () => Promise<string>;
    videoRef: React.RefObject<HTMLVideoElement>;
}

export const useCamera = (options: CameraOptions = {}): UseCameraReturn => {
    const {
        facingMode = 'environment', // Cámara trasera por defecto
        quality = 0.8,
        maxWidth = 1920,
        maxHeight = 1080
    } = options;

    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const isSupported = !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
    );

    const startCamera = useCallback(async () => {
        if (!isSupported) {
            const errorMsg = 'Cámara no soportada en este dispositivo';
            setError(errorMsg);
            throw new Error(errorMsg);
        }

        if (!videoRef.current) {
            const errorMsg = 'Elemento de video no disponible';
            setError(errorMsg);
            throw new Error(errorMsg);
        }

        try {
            setError(null);

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: maxWidth },
                    height: { ideal: maxHeight }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            setIsStreaming(true);
        } catch (err) {
            let errorMessage = 'Error al acceder a la cámara';

            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    errorMessage = 'Permiso de cámara denegado';
                } else if (err.name === 'NotFoundError') {
                    errorMessage = 'No se encontró cámara disponible';
                } else if (err.name === 'NotReadableError') {
                    errorMessage = 'Cámara en uso por otra aplicación';
                } else {
                    errorMessage = err.message;
                }
            }

            setError(errorMessage);
            console.error('Error de cámara:', err);
            throw new Error(errorMessage);
        }
    }, [isSupported, facingMode, maxWidth, maxHeight]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsStreaming(false);
        setError(null);
    }, []);

    const captureImage = useCallback(async (): Promise<string> => {
        if (!videoRef.current || !isStreaming) {
            const errorMsg = 'Cámara no está activa';
            setError(errorMsg);
            throw new Error(errorMsg);
        }

        try {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('No se pudo crear el contexto del canvas');
            }

            // Establecer dimensiones del canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Dibujar el frame actual del video en el canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convertir a base64
            const imageDataUrl = canvas.toDataURL('image/jpeg', quality);

            return imageDataUrl;
        } catch (err) {
            const errorMsg = 'Error al capturar imagen';
            setError(errorMsg);
            console.error('Error de captura:', err);
            throw new Error(errorMsg);
        }
    }, [isStreaming, quality]);

    return {
        isSupported,
        isStreaming,
        error,
        startCamera,
        stopCamera,
        captureImage,
        videoRef
    };
};
