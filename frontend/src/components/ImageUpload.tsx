import { useState, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/api';

interface ImageUploadProps {
    currentImage?: string;
    onUploadSuccess: (imageUrl: string) => void;
    uploadType: 'cover-image' | 'menu-item-image' | 'avatar';
    entityId: string; // caterer_id, menu_item_id, or user_id
    label?: string;
    aspectRatio?: 'square' | 'wide' | 'portrait';
}

export function ImageUpload({
    currentImage,
    onUploadSuccess,
    uploadType,
    entityId,
    label = 'Upload Image',
    aspectRatio = 'wide'
}: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { toast } = useToast();

    // Update preview when currentImage changes
    useEffect(() => {
        if (currentImage) {
            // Use relative URL which will be handled by proxy
            const imageUrl = currentImage.startsWith('http')
                ? currentImage
                : currentImage;
            setPreview(imageUrl);
        } else {
            setPreview(null);
        }
    }, [currentImage]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please select an image file',
                variant: 'destructive'
            });
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Image must be less than 5MB',
                variant: 'destructive'
            });
            return;
        }

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);

        // Add entity ID based on upload type
        const idField = uploadType === 'cover-image' ? 'caterer_id'
            : uploadType === 'menu-item-image' ? 'menu_item_id'
                : 'user_id';
        formData.append(idField, entityId);

        try {
            const token = localStorage.getItem('caterconnect_token');
            const response = await fetch(`${API_URL}/upload/${uploadType}`, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'Image uploaded successfully'
                });
                onUploadSuccess(data.data.imageUrl);
                setSelectedFile(null);
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error: any) {
            toast({
                title: 'Upload failed',
                description: error.message || 'Failed to upload image',
                variant: 'destructive'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setSelectedFile(null);
    };

    const aspectRatioClass = {
        square: 'aspect-square',
        wide: 'aspect-video',
        portrait: 'aspect-[3/4]'
    }[aspectRatio];

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium">{label}</label>

            <Card className="overflow-hidden">
                <CardContent className="p-4">
                    {preview ? (
                        <div className="relative">
                            <div className={`relative ${aspectRatioClass} w-full overflow-hidden rounded-lg`}>
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute right-2 top-2"
                                onClick={handleRemove}
                                disabled={isUploading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <label className={`flex cursor-pointer flex-col items-center justify-center ${aspectRatioClass} w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary hover:bg-muted`}>
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG, WebP up to 5MB
                            </p>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                            />
                        </label>
                    )}

                    {selectedFile && (
                        <div className="mt-4 flex gap-2">
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex-1"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload Image'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleRemove}
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
