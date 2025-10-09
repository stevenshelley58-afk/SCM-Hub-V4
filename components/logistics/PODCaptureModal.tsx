/**
 * POD Capture Modal
 * Enhanced Proof of Delivery capture with camera, signature, and GPS
 */

import React, { useState, useRef, useEffect } from 'react';
import { podService } from '../../services/logistics/podService';
import type { LogisticsTask } from '../../types';

interface PODCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: LogisticsTask;
    onComplete: () => void;
}

interface CapturedPhoto {
    id: string;
    dataUrl: string;
    timestamp: string;
}

export const PODCaptureModal: React.FC<PODCaptureModalProps> = ({ isOpen, onClose, task, onComplete }) => {
    const [step, setStep] = useState<'camera' | 'photos' | 'signature' | 'details'>('camera');
    const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
    const [signature, setSignature] = useState<string | null>(null);
    const [deliveredTo, setDeliveredTo] = useState('');
    const [deliveredToPhone, setDeliveredToPhone] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Capture GPS location
            captureGPS();
        } else {
            // Cleanup
            stopCamera();
            setPhotos([]);
            setSignature(null);
            setDeliveredTo('');
            setDeliveredToPhone('');
            setDeliveryNotes('');
            setStep('camera');
            setError(null);
        }
    }, [isOpen]);

    const captureGPS = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGpsLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('GPS error:', error);
                }
            );
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                const newPhoto: CapturedPhoto = {
                    id: `photo-${Date.now()}`,
                    dataUrl,
                    timestamp: new Date().toISOString(),
                };

                setPhotos([...photos, newPhoto]);
            }
        }
    };

    const deletePhoto = (photoId: string) => {
        setPhotos(photos.filter(p => p.id !== photoId));
    };

    const handleSubmit = async () => {
        // Validate
        if (photos.length === 0) {
            setError('Please capture at least one photo');
            return;
        }
        if (!deliveredTo.trim()) {
            setError('Please enter the name of the person who received the delivery');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Convert dataUrls to File objects
            const photoFiles = await Promise.all(
                photos.map(async (photo, index) => {
                    const response = await fetch(photo.dataUrl);
                    const blob = await response.blob();
                    return new File([blob], `photo-${index + 1}.jpg`, { type: 'image/jpeg' });
                })
            );

            // Create POD
            await podService.createPOD({
                task_id: task.task_id,
                photos: photoFiles,
                signature_img: signature || undefined,
                signature_name: deliveredTo,
                delivered_to: deliveredTo,
                delivered_to_phone: deliveredToPhone || undefined,
                delivery_notes: deliveryNotes || undefined,
                delivery_gps_lat: gpsLocation?.lat,
                delivery_gps_lng: gpsLocation?.lng,
            });

            // Success!
            stopCamera();
            onComplete();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to submit POD');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>
                    📸 Proof of Delivery - {task.task_number}
                </h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '24px',
                        cursor: 'pointer',
                    }}
                >
                    ×
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    textAlign: 'center',
                }}>
                    {error}
                </div>
            )}

            {/* Step Indicator */}
            <div style={{
                padding: '16px',
                backgroundColor: '#2a2a2a',
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
            }}>
                <StepIndicator label="Photos" active={step === 'camera' || step === 'photos'} completed={photos.length > 0} />
                <StepIndicator label="Signature" active={step === 'signature'} completed={!!signature} />
                <StepIndicator label="Details" active={step === 'details'} completed={!!deliveredTo} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                {step === 'camera' && (
                    <CameraView
                        videoRef={videoRef}
                        canvasRef={canvasRef}
                        onStartCamera={startCamera}
                        onCapture={capturePhoto}
                        onNext={() => {
                            stopCamera();
                            setStep('photos');
                        }}
                        photoCount={photos.length}
                        hasPhotos={photos.length > 0}
                    />
                )}

                {step === 'photos' && (
                    <PhotoReview
                        photos={photos}
                        onDelete={deletePhoto}
                        onAddMore={() => {
                            startCamera();
                            setStep('camera');
                        }}
                        onNext={() => setStep('signature')}
                    />
                )}

                {step === 'signature' && (
                    <SignatureCapture
                        signature={signature}
                        onSignatureChange={setSignature}
                        onSkip={() => setStep('details')}
                        onNext={() => setStep('details')}
                    />
                )}

                {step === 'details' && (
                    <DeliveryDetails
                        deliveredTo={deliveredTo}
                        deliveredToPhone={deliveredToPhone}
                        deliveryNotes={deliveryNotes}
                        onDeliveredToChange={setDeliveredTo}
                        onDeliveredToPhoneChange={setDeliveredToPhone}
                        onDeliveryNotesChange={setDeliveryNotes}
                        gpsLocation={gpsLocation}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                    />
                )}
            </div>
        </div>
    );
};

// Step Indicator Component
const StepIndicator: React.FC<{ label: string; active: boolean; completed: boolean }> = ({ label, active, completed }) => (
    <div style={{
        padding: '8px 16px',
        borderRadius: '20px',
        backgroundColor: completed ? '#44aa44' : active ? '#0066cc' : '#555',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
    }}>
        {completed ? '✓ ' : ''}{label}
    </div>
);

// Camera View Component
const CameraView: React.FC<{
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    onStartCamera: () => void;
    onCapture: () => void;
    onNext: () => void;
    photoCount: number;
    hasPhotos: boolean;
}> = ({ videoRef, canvasRef, onStartCamera, onCapture, onNext, photoCount, hasPhotos }) => {
    const [cameraStarted, setCameraStarted] = useState(false);

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
                backgroundColor: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '16px',
                position: 'relative',
            }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: cameraStarted ? 'block' : 'none',
                    }}
                />
                {!cameraStarted && (
                    <div style={{
                        padding: '100px 20px',
                        textAlign: 'center',
                        color: 'white',
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
                        <p>Camera ready to capture POD photos</p>
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ textAlign: 'center' }}>
                {!cameraStarted ? (
                    <button
                        onClick={() => {
                            onStartCamera();
                            setCameraStarted(true);
                        }}
                        style={{
                            padding: '16px 32px',
                            backgroundColor: '#0066cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                    >
                        Start Camera
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={onCapture}
                            style={{
                                padding: '16px 32px',
                                backgroundColor: '#44aa44',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                        >
                            📸 Capture Photo {photoCount > 0 ? `(${photoCount})` : ''}
                        </button>
                        {hasPhotos && (
                            <button
                                onClick={onNext}
                                style={{
                                    padding: '16px 32px',
                                    backgroundColor: '#0066cc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                }}
                            >
                                Next →
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Photo Review Component
const PhotoReview: React.FC<{
    photos: CapturedPhoto[];
    onDelete: (id: string) => void;
    onAddMore: () => void;
    onNext: () => void;
}> = ({ photos, onDelete, onAddMore, onNext }) => (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ color: 'white', marginBottom: '16px' }}>
            Review Photos ({photos.length})
        </h3>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px',
        }}>
            {photos.map(photo => (
                <div key={photo.id} style={{ position: 'relative' }}>
                    <img
                        src={photo.dataUrl}
                        alt="POD photo"
                        style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                        }}
                    />
                    <button
                        onClick={() => onDelete(photo.id)}
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '18px',
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
                onClick={onAddMore}
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                }}
            >
                + Add More Photos
            </button>
            <button
                onClick={onNext}
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                }}
            >
                Next →
            </button>
        </div>
    </div>
);

// Signature Capture Component
const SignatureCapture: React.FC<{
    signature: string | null;
    onSignatureChange: (sig: string | null) => void;
    onSkip: () => void;
    onNext: () => void;
}> = ({ signature, onSignatureChange, onSkip, onNext }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
            const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
            const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            onSignatureChange(canvas.toDataURL());
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                onSignatureChange(null);
            }
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            }
        }
    }, []);

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>
                Signature (Optional)
            </h3>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '8px',
                marginBottom: '16px',
            }}>
                <canvas
                    ref={canvasRef}
                    width={560}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{
                        border: '2px dashed #ddd',
                        borderRadius: '4px',
                        cursor: 'crosshair',
                        touchAction: 'none',
                    }}
                />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                    onClick={clearSignature}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                    }}
                >
                    Clear
                </button>
                <button
                    onClick={onSkip}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#888',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                    }}
                >
                    Skip
                </button>
                <button
                    onClick={onNext}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                    }}
                >
                    Next →
                </button>
            </div>
        </div>
    );
};

// Delivery Details Component
const DeliveryDetails: React.FC<{
    deliveredTo: string;
    deliveredToPhone: string;
    deliveryNotes: string;
    onDeliveredToChange: (value: string) => void;
    onDeliveredToPhoneChange: (value: string) => void;
    onDeliveryNotesChange: (value: string) => void;
    gpsLocation: { lat: number; lng: number } | null;
    onSubmit: () => void;
    submitting: boolean;
}> = ({
    deliveredTo,
    deliveredToPhone,
    deliveryNotes,
    onDeliveredToChange,
    onDeliveredToPhoneChange,
    onDeliveryNotesChange,
    gpsLocation,
    onSubmit,
    submitting,
}) => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ color: 'white', marginBottom: '16px' }}>
            Delivery Details
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 'bold' }}>
                Delivered To (Name) *
            </label>
            <input
                type="text"
                value={deliveredTo}
                onChange={(e) => onDeliveredToChange(e.target.value)}
                placeholder="Enter receiver's name"
                required
                style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                }}
            />
        </div>

        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'white', marginBottom: '8px' }}>
                Contact Phone
            </label>
            <input
                type="tel"
                value={deliveredToPhone}
                onChange={(e) => onDeliveredToPhoneChange(e.target.value)}
                placeholder="Optional"
                style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                }}
            />
        </div>

        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'white', marginBottom: '8px' }}>
                Delivery Notes
            </label>
            <textarea
                value={deliveryNotes}
                onChange={(e) => onDeliveryNotesChange(e.target.value)}
                placeholder="Any additional notes about the delivery..."
                rows={4}
                style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                }}
            />
        </div>

        {gpsLocation && (
            <div style={{
                padding: '12px',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                marginBottom: '16px',
            }}>
                <div style={{ color: 'white', fontSize: '14px' }}>
                    📍 GPS Location Captured
                </div>
                <div style={{ color: '#aaa', fontSize: '12px', marginTop: '4px' }}>
                    {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                </div>
            </div>
        )}

        <button
            onClick={onSubmit}
            disabled={submitting || !deliveredTo.trim()}
            style={{
                width: '100%',
                padding: '16px',
                backgroundColor: submitting || !deliveredTo.trim() ? '#666' : '#44aa44',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: submitting || !deliveredTo.trim() ? 'not-allowed' : 'pointer',
            }}
        >
            {submitting ? 'Submitting POD...' : '✓ Complete Delivery'}
        </button>
    </div>
);

