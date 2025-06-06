'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/common/components/ui';
import { useAuth } from '@/common/components/providers';
import { VehicleSchema, type VehicleInput, type VehicleWithImages } from '@/vehicle/models/vehicle.model';
import { ArrowLeft, Save } from 'lucide-react';

interface FormData extends Omit<VehicleInput, 'year' | 'mileage' | 'price'> {
  year: string;
  mileage: string;
  price: string;
}

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<VehicleWithImages | null>(null);
  const [formData, setFormData] = useState<FormData>({
    make: '',
    model: '',
    year: '',
    mileage: '',
    price: '',
    description: '',
    condition: 'good',
    location: '',
    zipCode: '',
    vin: '',
    transmission: 'automatic',
    fuelType: 'gasoline',
    exteriorColor: '',
    interiorColor: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vehicleId = params.id as string;

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`);
        if (response.ok) {
          const data = await response.json();
          const vehicleData = data.vehicle as VehicleWithImages;
          setVehicle(vehicleData);
          
          // Populate form with existing data
          setFormData({
            make: vehicleData.make || '',
            model: vehicleData.model || '',
            year: vehicleData.year?.toString() || '',
            mileage: vehicleData.mileage?.toString() || '',
            price: vehicleData.price?.toString() || '',
            description: vehicleData.description || '',
            condition: vehicleData.condition || 'good',
            location: vehicleData.location || '',
            zipCode: vehicleData.zipCode || '',
            vin: vehicleData.vin || '',
            transmission: vehicleData.transmission || 'automatic',
            fuelType: vehicleData.fuelType || 'gasoline',
            exteriorColor: vehicleData.exteriorColor || '',
            interiorColor: vehicleData.interiorColor || '',
          });
        } else if (response.status === 404) {
          router.push('/dashboard/vehicles');
        }
      } catch (error) {
        console.error('Failed to fetch vehicle:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && vehicleId) {
      fetchVehicle();
    }
  }, [user, vehicleId, router]);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.year.trim()) newErrors.year = 'Year is required';
    else if (isNaN(Number(formData.year)) || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear() + 1) {
      newErrors.year = 'Please enter a valid year';
    }

    if (!formData.price.trim()) newErrors.price = 'Price is required';
    else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Please enter a valid price';
    }
    
    if (formData.mileage.trim() && (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0)) {
      newErrors.mileage = 'Please enter a valid mileage';
    }
    
    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid zip code';
    }
    
    if (formData.vin && formData.vin.length !== 17) {
      newErrors.vin = 'VIN must be 17 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !vehicle) return;

    setSaving(true);
    try {
      // Convert string fields to numbers
      const vehicleData: VehicleInput = {
        ...formData,
        year: Number(formData.year),
        mileage: formData.mileage ? Number(formData.mileage) : undefined,
        price: Number(formData.price),
      };

      // Validate with Zod schema
      const validatedData = VehicleSchema.parse(vehicleData);

      // Update vehicle
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update vehicle');
      }

      router.push(`/dashboard/vehicles/${vehicle.id}`);
    } catch (error) {
      console.error('Failed to update vehicle:', error);
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vehicle not found</h3>
        <p className="text-gray-600 mb-4">The vehicle you're trying to edit doesn't exist or you don't have access to it.</p>
        <Link href="/dashboard/vehicles">
          <Button>Back to Vehicles</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/vehicles/${vehicle.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicle
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
          <p className="text-gray-600 mt-1">
            Update your vehicle listing information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Make *
                </label>
                <Input
                  value={formData.make}
                  onChange={(e) => updateFormData('make', e.target.value)}
                  placeholder="e.g., Toyota, BMW, Ford"
                  error={errors.make}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model *
                </label>
                <Input
                  value={formData.model}
                  onChange={(e) => updateFormData('model', e.target.value)}
                  placeholder="e.g., Camry, X5, F-150"
                  error={errors.model}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => updateFormData('year', e.target.value)}
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  error={errors.year}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VIN
                </label>
                <Input
                  value={formData.vin}
                  onChange={(e) => updateFormData('vin', e.target.value.toUpperCase())}
                  placeholder="17-character VIN"
                  maxLength={17}
                  error={errors.vin}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  placeholder="25000"
                  min="0"
                  error={errors.price}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mileage
                </label>
                <Input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => updateFormData('mileage', e.target.value)}
                  placeholder="50000"
                  min="0"
                  error={errors.mileage}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => updateFormData('condition', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transmission
                </label>
                <select
                  value={formData.transmission}
                  onChange={(e) => updateFormData('transmission', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="cvt">CVT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Type
                </label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => updateFormData('fuelType', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="plugin_hybrid">Plug-in Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zip Code
                </label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => updateFormData('zipCode', e.target.value)}
                  placeholder="12345"
                  error={errors.zipCode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exterior Color
                </label>
                <Input
                  value={formData.exteriorColor}
                  onChange={(e) => updateFormData('exteriorColor', e.target.value)}
                  placeholder="e.g., Black, White, Silver"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interior Color
                </label>
                <Input
                  value={formData.interiorColor}
                  onChange={(e) => updateFormData('interiorColor', e.target.value)}
                  placeholder="e.g., Black, Tan, Gray"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={4}
                placeholder="Describe your vehicle's features, condition, and any additional details..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex items-center justify-end space-x-4">
          <Link href={`/dashboard/vehicles/${vehicle.id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}