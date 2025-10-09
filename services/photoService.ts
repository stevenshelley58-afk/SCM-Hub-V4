// Photo Documentation Service
// In production, this would integrate with cloud storage (S3, Azure Blob, etc.)

export interface Photo {
    id: string;
    mrfId: string;
    type: 'condition' | 'storage' | 'delivery' | 'pod';
    url: string;
    thumbnailUrl: string;
    uploadedBy: string;
    uploadedAt: string;
    notes?: string;
    metadata: {
        filename: string;
        size: number;
        mimeType: string;
        width?: number;
        height?: number;
    };
}

export interface PhotoUploadResult {
    photo: Photo;
    compressed: boolean;
    originalSize: number;
    compressedSize: number;
}

let photos: Photo[] = [];

// Upload photo (simulated)
export const uploadPhoto = async (
    file: File,
    mrfId: string,
    type: Photo['type'],
    uploadedBy: string,
    notes?: string
): Promise<PhotoUploadResult> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
    }

    const photoId = `PHOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const originalSize = file.size;

    // Simulate upload and compression
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate compression (30-50% size reduction)
    const compressionRatio = 0.3 + Math.random() * 0.2;
    const compressedSize = Math.floor(originalSize * compressionRatio);
    const compressed = compressedSize < originalSize;

    // Create photo object
    const photo: Photo = {
        id: photoId,
        mrfId,
        type,
        url: `https://storage.scmhub.toll.com/photos/${photoId}.jpg`,
        thumbnailUrl: `https://storage.scmhub.toll.com/thumbnails/${photoId}_thumb.jpg`,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        notes,
        metadata: {
            filename: file.name,
            size: compressedSize,
            mimeType: file.type,
            width: 1920,
            height: 1080
        }
    };

    photos.unshift(photo);

    return {
        photo,
        compressed,
        originalSize,
        compressedSize
    };
};

// Upload multiple photos
export const uploadMultiplePhotos = async (
    files: File[],
    mrfId: string,
    type: Photo['type'],
    uploadedBy: string,
    notes?: string
): Promise<PhotoUploadResult[]> => {
    const results: PhotoUploadResult[] = [];

    for (const file of files) {
        try {
            const result = await uploadPhoto(file, mrfId, type, uploadedBy, notes);
            results.push(result);
        } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
        }
    }

    return results;
};

// Get photos for MRF
export const getPhotosForMRF = (mrfId: string, type?: Photo['type']): Photo[] => {
    let filtered = photos.filter(p => p.mrfId === mrfId);
    
    if (type) {
        filtered = filtered.filter(p => p.type === type);
    }

    return filtered;
};

// Get all photos
export const getAllPhotos = (filters?: {
    type?: Photo['type'];
    uploadedBy?: string;
    startDate?: string;
    endDate?: string;
}): Photo[] => {
    let filtered = [...photos];

    if (filters) {
        if (filters.type) {
            filtered = filtered.filter(p => p.type === filters.type);
        }
        if (filters.uploadedBy) {
            filtered = filtered.filter(p => p.uploadedBy === filters.uploadedBy);
        }
        if (filters.startDate) {
            filtered = filtered.filter(p => p.uploadedAt >= filters.startDate!);
        }
        if (filters.endDate) {
            filtered = filtered.filter(p => p.uploadedAt <= filters.endDate!);
        }
    }

    return filtered;
};

// Delete photo
export const deletePhoto = (photoId: string): void => {
    photos = photos.filter(p => p.id !== photoId);
};

// Update photo notes
export const updatePhotoNotes = (photoId: string, notes: string): void => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
        photo.notes = notes;
    }
};

// Compress image (simulated)
export const compressImage = async (file: File, quality: number = 0.8): Promise<Blob> => {
    // In production, this would use canvas API or library like pica
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const compressedSize = Math.floor(file.size * quality);
    return new Blob([new ArrayBuffer(compressedSize)], { type: file.type });
};

// Generate thumbnail (simulated)
export const generateThumbnail = async (file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<Blob> => {
    // In production, this would use canvas API to resize
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const thumbnailSize = Math.floor(file.size * 0.1);
    return new Blob([new ArrayBuffer(thumbnailSize)], { type: file.type });
};

// Get storage usage
export const getStorageUsage = (): { totalSize: number; photoCount: number; averageSize: number } => {
    const totalSize = photos.reduce((sum, p) => sum + p.metadata.size, 0);
    const photoCount = photos.length;
    const averageSize = photoCount > 0 ? totalSize / photoCount : 0;

    return {
        totalSize,
        photoCount,
        averageSize
    };
};

// Initialize sample photos
export const initializeSamplePhotos = () => {
    const now = Date.now();

    photos = [
        {
            id: 'PHOTO-SAMPLE-001',
            mrfId: 'MRF-1240',
            type: 'storage',
            url: 'https://storage.scmhub.toll.com/photos/sample001.jpg',
            thumbnailUrl: 'https://storage.scmhub.toll.com/thumbnails/sample001_thumb.jpg',
            uploadedBy: 'JJ',
            uploadedAt: new Date(now - 3600000).toISOString(),
            notes: 'Material stored in Warehouse 1, Aisle A3',
            metadata: {
                filename: 'warehouse_materials.jpg',
                size: 245678,
                mimeType: 'image/jpeg',
                width: 1920,
                height: 1080
            }
        },
        {
            id: 'PHOTO-SAMPLE-002',
            mrfId: 'MRF-1238',
            type: 'delivery',
            url: 'https://storage.scmhub.toll.com/photos/sample002.jpg',
            thumbnailUrl: 'https://storage.scmhub.toll.com/thumbnails/sample002_thumb.jpg',
            uploadedBy: 'Tom Chen',
            uploadedAt: new Date(now - 7200000).toISOString(),
            notes: 'Delivered to Weld Shop - confirmed by supervisor',
            metadata: {
                filename: 'delivery_confirmation.jpg',
                size: 198450,
                mimeType: 'image/jpeg',
                width: 1920,
                height: 1080
            }
        },
        {
            id: 'PHOTO-SAMPLE-003',
            mrfId: 'MRF-1240',
            type: 'condition',
            url: 'https://storage.scmhub.toll.com/photos/sample003.jpg',
            thumbnailUrl: 'https://storage.scmhub.toll.com/thumbnails/sample003_thumb.jpg',
            uploadedBy: 'JJ',
            uploadedAt: new Date(now - 1800000).toISOString(),
            notes: 'Valve condition before pickup - no visible damage',
            metadata: {
                filename: 'valve_condition.jpg',
                size: 312890,
                mimeType: 'image/jpeg',
                width: 1920,
                height: 1080
            }
        }
    ];
};

// Initialize sample data
initializeSamplePhotos();
