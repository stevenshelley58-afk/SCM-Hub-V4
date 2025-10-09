import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from './Icons';

interface PODData {
    photos: string[]; // Base64 encoded images
    signature: string; // Base64 encoded signature
    recipientName: string;
    recipientTitle?: string;
    gpsCoordinates?: { latitude: number; longitude: number };
    notes?: string;
    timestamp: string;
}

interface PODCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (podData: PODData) => void;
    requestId: string;
}

export const PODCaptureModal: React.FC<PODCaptureModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    requestId
}) => {
    const [currentStep, setCurrentStep] = useState(1); // 1: Photos, 2: Signature, 3: Details
    const [photos, setPhotos] = useState<string[]>([]);
    const [signature, setSignature] = useState<string>('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientTitle, setRecipientTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [gpsCoordinates, setGpsCoordinates] = useState<{ latitude: number; longitude: number } | undefined>();
    const [isDrawing, setIsDrawing] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get GPS coordinates on mount
    useEffect(() => {
        if (isOpen && !gpsCoordinates) {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setGpsCoordinates({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.warn('GPS not available:', error);
                    }
                );
            }
        }
    }, [isOpen]);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && currentStep === 2) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    }, [currentStep]);

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            if (photos.length >= 5) {
                alert('Maximum 5 photos allowed');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Compress image (basic compression)
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 600;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressed = canvas.toDataURL('image/jpeg', 0.7);
                        setPhotos(prev => [...prev, compressed]);
                    }
                };
                img.src = base64;
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let x, y;
        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let x, y;
        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = canvasRef.current;
            if (canvas) {
                setSignature(canvas.toDataURL('image/png'));
            }
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setSignature('');
            }
        }
    };

    const handleNext = () => {
        if (currentStep === 1 && photos.length === 0) {
            alert('Please capture at least one photo');
            return;
        }
        if (currentStep === 2 && !signature) {
            alert('Please provide a signature');
            return;
        }
        if (currentStep < 3) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        if (!recipientName.trim()) {
            alert('Please enter recipient name');
            return;
        }

        const podData: PODData = {
            photos,
            signature,
            recipientName: recipientName.trim(),
            recipientTitle: recipientTitle.trim() || undefined,
            gpsCoordinates,
            notes: notes.trim() || undefined,
            timestamp: new Date().toISOString()
        };

        onSubmit(podData);
        
        // Reset form
        setPhotos([]);
        setSignature('');
        setRecipientName('');
        setRecipientTitle('');
        setNotes('');
        setGpsCoordinates(undefined);
        setCurrentStep(1);
    };

    const handleCancel = () => {
        // Reset form
        setPhotos([]);
        setSignature('');
        setRecipientName('');
        setRecipientTitle('');
        setNotes('');
        setGpsCoordinates(undefined);
        setCurrentStep(1);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Proof of Delivery - {requestId}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Step {currentStep} of 3: {
                                    currentStep === 1 ? 'Photos' :
                                    currentStep === 2 ? 'Signature' :
                                    'Details'
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            <ICONS.XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 flex space-x-2">
                        {[1, 2, 3].map(step => (
                            <div
                                key={step}
                                className={`flex-1 h-2 rounded-full ${
                                    step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    {/* Step 1: Photos */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Delivery Photos ({photos.length}/5)
                                </h4>
                                <p className="text-xs text-gray-500 mb-4">
                                    Take photos of the delivered materials and delivery location
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    {photos.map((photo, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={photo}
                                                alt={`Delivery ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                                            />
                                            <button
                                                onClick={() => removePhoto(index)}
                                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ICONS.TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {photos.length < 5 && (
                                        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                            <ICONS.CameraIcon className="h-8 w-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500">Add Photo</span>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                multiple
                                                onChange={handlePhotoCapture}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {gpsCoordinates && (
                                <div className="flex items-center text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                                    <ICONS.MapPinIcon className="h-5 w-5 text-green-600 mr-2" />
                                    <span>
                                        Location captured: {gpsCoordinates.latitude.toFixed(6)}, {gpsCoordinates.longitude.toFixed(6)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Signature */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Recipient Signature
                                </h4>
                                <p className="text-xs text-gray-500 mb-4">
                                    Please have the recipient sign below
                                </p>

                                <div className="border-2 border-gray-300 rounded-lg bg-white">
                                    <canvas
                                        ref={canvasRef}
                                        width={600}
                                        height={300}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                        className="w-full h-64 touch-none cursor-crosshair"
                                        style={{ touchAction: 'none' }}
                                    />
                                </div>

                                <button
                                    onClick={clearSignature}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Clear Signature
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Details */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Recipient Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    placeholder="Full name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Recipient Title / Role
                                </label>
                                <input
                                    type="text"
                                    value={recipientTitle}
                                    onChange={(e) => setRecipientTitle(e.target.value)}
                                    placeholder="e.g., Site Supervisor, Engineer"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any additional notes about the delivery..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <h5 className="font-medium text-gray-900">Delivery Summary</h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex items-center">
                                        <ICONS.CameraIcon className="h-4 w-4 mr-2" />
                                        {photos.length} photo(s) captured
                                    </div>
                                    <div className="flex items-center">
                                        <ICONS.PencilIcon className="h-4 w-4 mr-2" />
                                        Signature obtained
                                    </div>
                                    {gpsCoordinates && (
                                        <div className="flex items-center">
                                            <ICONS.MapPinIcon className="h-4 w-4 mr-2" />
                                            GPS location recorded
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <ICONS.ClockIcon className="h-4 w-4 mr-2" />
                                        {new Date().toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>

                    <div className="flex space-x-3">
                        {currentStep > 1 && (
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Back
                            </button>
                        )}

                        {currentStep < 3 ? (
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Complete Delivery
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

