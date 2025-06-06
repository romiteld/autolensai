'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, FileUpload } from '@/common/components/ui';
import { useAuth } from '@/common/components/providers';
import { VehicleSchema, type VehicleInput } from '@/vehicle/models/vehicle.model';
import { ArrowLeft, ArrowRight, Car, Check } from 'lucide-react';

interface FormData extends Omit<VehicleInput, 'year' | 'mileage' | 'price'> {
  year: string;
  mileage: string;
  price: string;
}

const initialFormData: FormData = {
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
};

const steps = [
  { id: 1, title: 'Basic Information', description: 'Vehicle make, model, and year' },
  { id: 2, title: 'Details & Pricing', description: 'Condition, mileage, and price' },
  { id: 3, title: 'Images', description: 'Upload vehicle photos' },
  { id: 4, title: 'Review & Submit', description: 'Review and submit your listing' },
];

export default function CreateVehiclePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.make.trim()) newErrors.make = 'Make is required';
        if (!formData.model.trim()) newErrors.model = 'Model is required';
        if (!formData.year.trim()) newErrors.year = 'Year is required';
        else if (isNaN(Number(formData.year)) || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear() + 1) {
          newErrors.year = 'Please enter a valid year';
        }
        break;

      case 2:
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
        break;

      case 3:
        if (images.length === 0) {
          newErrors.images = 'At least one image is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
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

      // Create vehicle
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to create vehicle');
      }

      const { vehicle } = await response.json();

      // TODO: Upload images to vehicle
      // This would typically involve uploading to Cloudinary and associating with the vehicle
      
      router.push(`/dashboard/vehicles/${vehicle.id}`);
    } catch (error) {
      console.error('Failed to create vehicle:', error);
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
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
                  VIN (Optional)
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Details & Pricing</h3>
            
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Upload Images</h3>
            <p className="text-gray-600">
              Add high-quality images of your vehicle. The first image will be used as the primary photo.
            </p>
            
            <FileUpload
              files={images}
              onFilesChange={setImages}
              maxFiles={10}
              accept="image/*"
            />
            
            {errors.images && (
              <p className="text-sm text-red-600">{errors.images}</p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review Your Listing</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Vehicle Information</h4>
                  <p className="text-gray-600">{formData.year} {formData.make} {formData.model}</p>
                  {formData.price && <p className="text-lg font-bold text-blue-600">${Number(formData.price).toLocaleString()}</p>}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Details</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    {formData.mileage && <li>Mileage: {Number(formData.mileage).toLocaleString()} miles</li>}
                    <li>Condition: {formData.condition}</li>
                    <li>Transmission: {formData.transmission}</li>
                    <li>Fuel Type: {formData.fuelType?.replace('_', ' ')}</li>
                  </ul>
                </div>
              </div>
              
              {formData.description && (
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-gray-600 text-sm">{formData.description}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-gray-900">Images</h4>
                <p className="text-gray-600 text-sm">{images.length} image(s) selected</p>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/vehicles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
          <p className="text-gray-600 mt-1">
            Create a new vehicle listing with AI-powered enhancements
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 ml-6 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        
        <div>
          {currentStep < steps.length ? (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              loading={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Vehicle Listing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}