"use client"

import { useState, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, Loader2, Save, Trash2, AlertTriangle, Package, ChevronsUpDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store-context';
import { inventory_base_url, image_base_url } from '@/lib/api-config';
import { cn } from "@/lib/utils";

const IMAGE_API_URL = process.env.NODE_ENV === 'production'
  ? `${image_base_url}/images`
  : 'http://localhost:8081/api/v1/images';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

interface Category {
  id: string;
  category_name: string;
}

interface Supplier {
  id: string;
  supplier_name: string;
}

interface ProductFormData {
  sku: string;
  product_name: string;
  description: string;
  category_id: string;
  supplier_id: string;
  selling_price: string;
  minimum_selling_price: string;
  wholesale_price: string;
  unit_of_measure: string;
  reorder_level: string;
  track_inventory: boolean;
  is_active: boolean;
  image_id?: string;
}

// Helper function to format data for Go backend
const formatProductForBackend = (formData: any, imageId?: string) => {
  const toNullString = (value: string) => {
    const trimmed = value?.trim() || '';
    return trimmed 
      ? { String: trimmed, Valid: true } 
      : { String: '', Valid: false };
  };

  const toNullFloat64 = (value: string) => {
    if (!value || value.trim() === '') {
      return { Float64: 0, Valid: false };
    }
    const num = parseFloat(value);
    return !isNaN(num) 
      ? { Float64: num, Valid: true } 
      : { Float64: 0, Valid: false };
  };

  const toNullUUID = (value?: string) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed === '00000000-0000-0000-0000-000000000000') {
      return null;
    }
    return trimmed;
  };

  const payload: any = {
    sku: formData.sku.trim(),
    product_name: formData.product_name.trim(),
    description: toNullString(formData.description),
    barcode: toNullString(formData.barcode || ''),
    selling_price: parseFloat(formData.selling_price) || 0,
    minimum_selling_price: toNullFloat64(formData.minimum_selling_price),
    wholesale_price: toNullFloat64(formData.wholesale_price),
    unit_of_measure: formData.unit_of_measure.trim(),
    reorder_level: parseInt(formData.reorder_level) || 0,
    track_inventory: formData.track_inventory,
    is_active: formData.is_active,
    brand: toNullString(formData.brand || ''),
    color: toNullString(formData.color || ''),
    size: toNullString(formData.size || ''),
    is_featured: formData.is_featured || false,
  };

  const categoryId = toNullUUID(formData.category_id);
  if (categoryId) payload.category_id = categoryId;

  const supplierId = toNullUUID(formData.supplier_id);
  if (supplierId) payload.supplier_id = supplierId;

  const imgId = toNullUUID(imageId); 
  if (imgId) payload.image_id = imgId;

  return payload;
};

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { currentStore } = useStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageSuccessModal, setShowImageSuccessModal] = useState(false);
  const [showProductSuccessModal, setShowProductSuccessModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Searchable dropdown states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  // Image state
  const [presignedImageUrl, setPresignedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bucketId, setBucketId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    product_name: '',
    description: '',
    category_id: '',
    supplier_id: '',
    selling_price: '',
    minimum_selling_price: '',
    wholesale_price: '',
    unit_of_measure: '',
    reorder_level: '',
    track_inventory: true,
    is_active: true,
    image_id: undefined,
  });

  useEffect(() => {
    if (id && currentStore?.id) {
      fetchProduct();
      fetchCategories();
      fetchSuppliers();
      fetchBuckets();
    }
  }, [id, currentStore?.id]);

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!formData.image_id) {
        setImageLoading(false);
        setImageError(true);
        return;
      }

      setImageLoading(true);
      const finalUrl = `${IMAGE_API_URL}/${formData.image_id}/presigned-url?expiration=1440`;
      
      try {
        const accessToken = localStorage.getItem('access_token');
        const sessionToken = localStorage.getItem('session_token');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        if (sessionToken) {
          headers['X-Session-Token'] = sessionToken;
        }

        const response = await fetch(finalUrl, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data?.presigned_url) {
          setPresignedImageUrl(data.data.presigned_url);
          setImageError(false);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };
    
    if (formData.image_id && !previewUrl) {
      fetchPresignedUrl();
    }
  }, [formData.image_id, previewUrl]);

  const fetchBuckets = async () => {
    try {
      const response = await fetch(`${IMAGE_API_URL.replace('/images', '')}/buckets`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch buckets');

      const data = await response.json();
      const bucketsData = Array.isArray(data) ? data : (data.data || []);
      
      if (bucketsData.length > 0) {
        const activeBucket = bucketsData.find((b: any) => b.active) || bucketsData[0];
        setBucketId(activeBucket.id);
      }
    } catch (error) {
      console.error('Failed to fetch buckets:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !bucketId || !id) return;

    try {
      setIsUploadingImage(true);

      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('bucket_id', bucketId);
      formDataToSend.append('compress', 'true');

      const baseUrl = IMAGE_API_URL.replace('/images', '');
      
      const response = await fetch(`${baseUrl}/products/${id}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await response.json();
      const uploadedImageId = data.data?.id;

      if (!uploadedImageId) throw new Error('No image ID returned');

      // Update form data with new image ID
      setFormData({ ...formData, image_id: uploadedImageId });
      setSelectedFile(null);
      setPreviewUrl(null);
      setPresignedImageUrl(null);
      
      // Refresh product data to get the updated image
      await fetchProduct();

      // Show success modal
      setShowImageSuccessModal(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteProductImage = async () => {
    if (!formData.image_id || !id) {
      toast({
        title: 'Error',
        description: 'No image to delete',
        variant: 'destructive',
      });
      return;
    }

    try {
      const baseUrl = IMAGE_API_URL.replace('/images', '');
      
      const deleteResponse = await fetch(
        `${baseUrl}/products/${id}/images/${formData.image_id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-Session-Token': localStorage.getItem('session_token') || '',
          },
        }
      );

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || 'Failed to remove image');
      }

      // Update local state
      setFormData({ ...formData, image_id: undefined });
      setPresignedImageUrl(null);

      toast({
        title: 'Success',
        description: 'Image removed from product',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove image',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${inventory_base_url}/products/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch product');

      const data = await response.json();
      const product = data.data || data;

      const getNullableValue = (field: any) => {
        if (field && typeof field === 'object' && 'Valid' in field) {
          return field.Valid ? field.String || field.Float64 || '' : '';
        }
        return field || '';
      };

      setFormData({
        sku: product.sku || '',
        product_name: product.product_name || '',
        description: getNullableValue(product.description),
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        selling_price: product.selling_price?.toString() || '0',
        minimum_selling_price: getNullableValue(product.minimum_selling_price)?.toString() || '',
        wholesale_price: getNullableValue(product.wholesale_price)?.toString() || '',
        unit_of_measure: product.unit_of_measure || '',
        reorder_level: product.reorder_level?.toString() || '0',
        track_inventory: product.track_inventory ?? true,
        is_active: product.is_active ?? true,
        image_id: product.image_id || undefined,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
      router.push('/dashboard/products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${inventory_base_url}/categories`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const categoriesData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${inventory_base_url}/suppliers`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const suppliersData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        setSuppliers(suppliersData);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      setSuppliers([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.product_name.trim()) newErrors.product_name = 'Product name is required';
    if (!formData.unit_of_measure.trim()) newErrors.unit_of_measure = 'Unit of measure is required';

    const sellingPrice = parseFloat(formData.selling_price);

    if (isNaN(sellingPrice) || sellingPrice < 0) {
      newErrors.selling_price = 'Valid selling price is required';
    }

    if (formData.minimum_selling_price) {
      const minPrice = parseFloat(formData.minimum_selling_price);
      if (!isNaN(minPrice) && !isNaN(sellingPrice) && minPrice > sellingPrice) {
        newErrors.minimum_selling_price = 'Minimum price cannot be higher than selling price';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        sku: formData.sku.trim(),
        product_name: formData.product_name.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
        selling_price: parseFloat(formData.selling_price),
        minimum_selling_price: formData.minimum_selling_price
          ? parseFloat(formData.minimum_selling_price)
          : null,
        wholesale_price: formData.wholesale_price
          ? parseFloat(formData.wholesale_price)
          : null,
        unit_of_measure: formData.unit_of_measure.trim(),
        reorder_level: parseInt(formData.reorder_level) || 0,
        track_inventory: formData.track_inventory,
        is_active: formData.is_active,
      };

      const response = await fetch(`${inventory_base_url}/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      // Show success modal
      setShowProductSuccessModal(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update product',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`${inventory_base_url}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      router.push('/dashboard/products');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete product',
        variant: 'destructive',
      });
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.category_name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(sup =>
    sup.supplier_name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  // Get selected category name
  const selectedCategory = categories.find(cat => cat.id === formData.category_id);
  
  // Get selected supplier name
  const selectedSupplier = suppliers.find(sup => sup.id === formData.supplier_id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground mt-1">
              Update product information
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Product Image Display */}
      <Card>
        <CardHeader>
          <CardTitle>Product Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-64 h-64 rounded-lg object-cover border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : imageLoading ? (
              <div className="w-64 h-64 rounded-lg bg-muted flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            ) : imageError || !presignedImageUrl ? (
              <div className="w-64 h-64 rounded-lg bg-muted flex flex-col items-center justify-center border-2 border-dashed">
                <Package className="h-16 w-16 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No image available</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={presignedImageUrl}
                  alt={formData.product_name}
                  className="w-64 h-64 rounded-lg object-cover border"
                  onError={() => setImageError(true)}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleDeleteProductImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!previewUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {formData.image_id ? 'Change Image' : 'Upload Image'}
              </Button>
            )}

            {selectedFile && previewUrl && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveImage}
                  disabled={isUploadingImage}
                >
                  Cancel
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Supported formats: JPG, PNG, WebP. Max size: 10MB
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className={errors.sku ? 'border-red-500' : ''}
                />
                {errors.sku && (
                  <p className="text-sm text-red-500">{errors.sku}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, product_name: e.target.value })
                  }
                  className={errors.product_name ? 'border-red-500' : ''}
                />
                {errors.product_name && (
                  <p className="text-sm text-red-500">{errors.product_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Category and Supplier with Searchable Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryOpen}
                      className="w-full justify-between"
                    >
                      {selectedCategory?.category_name || "Select category..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search category..." 
                        value={categorySearch}
                        onValueChange={setCategorySearch}
                      />
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setFormData({ ...formData, category_id: "" });
                            setCategoryOpen(false);
                            setCategorySearch("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !formData.category_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {filteredCategories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.category_name}
                            onSelect={() => {
                              setFormData({ ...formData, category_id: category.id });
                              setCategoryOpen(false);
                              setCategorySearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.category_id === category.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {category.category_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
                <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={supplierOpen}
                      className="w-full justify-between"
                    >
                      {selectedSupplier?.supplier_name || "Select supplier..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search supplier..." 
                        value={supplierSearch}
                        onValueChange={setSupplierSearch}
                      />
                      <CommandEmpty>No supplier found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setFormData({ ...formData, supplier_id: "" });
                            setSupplierOpen(false);
                            setSupplierSearch("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !formData.supplier_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {filteredSuppliers.map((supplier) => (
                          <CommandItem
                            key={supplier.id}
                            value={supplier.supplier_name}
                            onSelect={() => {
                              setFormData({ ...formData, supplier_id: supplier.id });
                              setSupplierOpen(false);
                              setSupplierSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.supplier_id === supplier.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {supplier.supplier_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Pricing - Removed Buying Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selling_price">
                  Selling Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) =>
                    setFormData({ ...formData, selling_price: e.target.value })
                  }
                  className={errors.selling_price ? 'border-red-500' : ''}
                />
                {errors.selling_price && (
                  <p className="text-sm text-red-500">{errors.selling_price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_selling_price">Minimum Selling Price</Label>
                <Input
                  id="minimum_selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimum_selling_price}
                  onChange={(e) =>
                    setFormData({ ...formData, minimum_selling_price: e.target.value })
                  }
                  className={errors.minimum_selling_price ? 'border-red-500' : ''}
                />
                {errors.minimum_selling_price && (
                  <p className="text-sm text-red-500">{errors.minimum_selling_price}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wholesale_price">Wholesale Price</Label>
                <Input
                  id="wholesale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wholesale_price}
                  onChange={(e) =>
                    setFormData({ ...formData, wholesale_price: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_of_measure">
                  Unit of Measure <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unit_of_measure"
                  placeholder="e.g., piece, kg, liter"
                  value={formData.unit_of_measure}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_of_measure: e.target.value })
                  }
                  className={errors.unit_of_measure ? 'border-red-500' : ''}
                />
                {errors.unit_of_measure && (
                  <p className="text-sm text-red-500">{errors.unit_of_measure}</p>
                )}
              </div>
            </div>

            {/* Inventory Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level</Label>
                <Input
                  id="reorder_level"
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) =>
                    setFormData({ ...formData, reorder_level: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="track_inventory">Track Inventory</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable inventory tracking for this product
                  </p>
                </div>
                <Switch
                  id="track_inventory"
                  checked={formData.track_inventory}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, track_inventory: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Set product as active or inactive
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/dashboard/products">
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Image Upload Success Modal */}
      <Dialog open={showImageSuccessModal} onOpenChange={setShowImageSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-xl">Image Updated Successfully!</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              The product image has been uploaded and updated successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              onClick={() => setShowImageSuccessModal(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Update Success Modal */}
      <Dialog open={showProductSuccessModal} onOpenChange={setShowProductSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-xl">Product Updated Successfully!</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              All product information has been saved successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              onClick={() => {
                setShowProductSuccessModal(false);
                router.push('/dashboard/products');
              }}
            >
              Go to Products
            </Button>
            <Button
              onClick={() => setShowProductSuccessModal(false)}
              variant="outline"
            >
              Stay Here
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
              All associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Product'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}