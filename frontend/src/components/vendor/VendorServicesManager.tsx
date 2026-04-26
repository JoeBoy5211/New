import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Camera, X } from 'lucide-react';

const PREDEFINED_SERVICES = [
  'Photography',
  'Videography',
  'Makeup & Styling',
  'Decor & Floral',
  'DJ & Sound System',
  'MC / Event Host',
  'Event Planning',
  'Venue Rental',
  'Transportation',
  'Cake & Desserts',
  'Photo Booth',
  'Lighting',
  'Other',
];

interface VendorService {
  id: string;
  service_name: string;
  description: string;
  sample_images: string[];
}

interface VendorServicesManagerProps {
  services: VendorService[];
  catererId: string;
  onAddService: (formData: FormData) => Promise<{ success: boolean; data?: any; message?: string }>;
  onDeleteService: (serviceId: string) => Promise<{ success: boolean; message?: string }>;
  onRefresh: () => void;
}

export default function VendorServicesManager({
  services,
  catererId,
  onAddService,
  onDeleteService,
  onRefresh,
}: VendorServicesManagerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [customName, setCustomName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file', description: `${file.name} is not an image`, variant: 'destructive' });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} exceeds 5MB`, variant: 'destructive' });
        continue;
      }
      validFiles.push(file);
    }

    if (selectedFiles.length + validFiles.length > 10) {
      toast({ title: 'Too many images', description: 'Maximum 10 images per service', variant: 'destructive' });
      return;
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const finalName = serviceName === 'Other' ? customName.trim() : serviceName;
    if (!finalName) {
      toast({ title: 'Service name required', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('catererId', catererId);
    formData.append('service_name', finalName);
    formData.append('description', description);
    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    const res = await onAddService(formData);
    setIsUploading(false);

    if (res.success) {
      toast({ title: 'Service added successfully' });
      setOpen(false);
      resetForm();
      onRefresh();
    } else {
      toast({ title: 'Error', description: res.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setServiceName('');
    setCustomName('');
    setDescription('');
    setSelectedFiles([]);
    setPreviews([]);
  };

  const handleDelete = async (serviceId: string) => {
    const res = await onDeleteService(serviceId);
    if (res.success) {
      toast({ title: 'Service deleted' });
      onRefresh();
    } else {
      toast({ title: 'Error', description: res.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Additional Services</h2>
          <p className="text-sm text-muted-foreground">
            Let customers know about other services you offer alongside catering
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Additional Service</DialogTitle>
              <DialogDescription>
                Showcase other services your business offers. No pricing required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Select value={serviceName} onValueChange={setServiceName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_SERVICES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {serviceName === 'Other' && (
                <div className="space-y-2">
                  <Label>Custom Service Name</Label>
                  <Input
                    placeholder="e.g., Live Cooking Station"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what you offer for this service..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: briefly describe packages, experience, or what makes your service special.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sample Images</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={selectedFiles.length >= 10}
                />
                <p className="text-xs text-muted-foreground">
                  Upload up to 10 images (5MB each) showcasing your work for this service.
                </p>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={preview} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Save Service'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Camera className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium">No additional services listed yet</p>
            <p className="text-sm mt-1">
              Add services like Photography, Decor, DJ, and more to help customers discover everything you offer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden group">
              {service.sample_images && service.sample_images.length > 0 && (
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={service.sample_images[0]}
                    alt={service.service_name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {service.sample_images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      +{service.sample_images.length - 1}
                    </div>
                  )}
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{service.service_name}</CardTitle>
                {service.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {service.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {service.sample_images.length > 1 && (
                  <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                    {service.sample_images.slice(1, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt=""
                        className="h-12 w-12 rounded object-cover flex-shrink-0 border"
                      />
                    ))}
                    {service.sample_images.length > 4 && (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0 border">
                        +{service.sample_images.length - 4}
                      </div>
                    )}
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => handleDelete(service.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
