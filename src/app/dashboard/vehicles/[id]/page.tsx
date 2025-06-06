'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/common/components/ui';
import { useAuth } from '@/common/components/providers';
import type { VehicleWithImages } from '@/vehicle/models/vehicle.model';
import { 
  Car, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  MapPin, 
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Palette,
  Eye,
  Share2,
  MoreVertical
} from 'lucide-react';

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<VehicleWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const vehicleId = params.id as string;

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`);
        if (response.ok) {
          const data = await response.json();
          setVehicle(data.vehicle);
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

  const handleDelete = async () => {
    if (!vehicle || !confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/vehicles');
      } else {
        alert('Failed to delete vehicle. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      alert('Failed to delete vehicle. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vehicle not found</h3>
        <p className="text-gray-600 mb-4">The vehicle you're looking for doesn't exist or you don't have access to it.</p>
        <Link href="/dashboard/vehicles">
          <Button>Back to Vehicles</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/vehicles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                {vehicle.status}
              </span>
              {vehicle.featured && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Featured
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
            loading={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicle.images.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={vehicle.images[selectedImageIndex]?.processedUrl || vehicle.images[selectedImageIndex]?.originalUrl}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Thumbnail Grid */}
                  {vehicle.images.length > 1 && (
                    <div className="grid grid-cols-6 gap-2">
                      {vehicle.images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`aspect-square bg-gray-200 rounded-md overflow-hidden border-2 transition-colors ${
                            selectedImageIndex === index ? 'border-blue-500' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={image.processedUrl || image.originalUrl}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No images uploaded</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Details */}
        <div className="space-y-6">
          {/* Price & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicle.price && (
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-2xl font-bold text-blue-600">{formatPrice(vehicle.price)}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Year</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-gray-600">Make</p>
                  <p className="font-medium">{vehicle.make}</p>
                </div>
                <div>
                  <p className="text-gray-600">Model</p>
                  <p className="font-medium">{vehicle.model}</p>
                </div>
                {vehicle.condition && (
                  <div>
                    <p className="text-gray-600">Condition</p>
                    <p className="font-medium capitalize">{vehicle.condition}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vehicle.mileage && (
                <div className="flex items-center space-x-3">
                  <Gauge className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Mileage</p>
                    <p className="font-medium">{vehicle.mileage.toLocaleString()} miles</p>
                  </div>
                </div>
              )}
              
              {vehicle.transmission && (
                <div className="flex items-center space-x-3">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Transmission</p>
                    <p className="font-medium capitalize">{vehicle.transmission}</p>
                  </div>
                </div>
              )}
              
              {vehicle.fuelType && (
                <div className="flex items-center space-x-3">
                  <Fuel className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Fuel Type</p>
                    <p className="font-medium capitalize">{vehicle.fuelType.replace('_', ' ')}</p>
                  </div>
                </div>
              )}
              
              {vehicle.exteriorColor && (
                <div className="flex items-center space-x-3">
                  <Palette className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Exterior Color</p>
                    <p className="font-medium">{vehicle.exteriorColor}</p>
                  </div>
                </div>
              )}
              
              {vehicle.interiorColor && (
                <div className="flex items-center space-x-3">
                  <Palette className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Interior Color</p>
                    <p className="font-medium">{vehicle.interiorColor}</p>
                  </div>
                </div>
              )}
              
              {vehicle.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{vehicle.location}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {vehicle.vin && (
                <div>
                  <p className="text-gray-600">VIN</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded">{vehicle.vin}</p>
                </div>
              )}
              
              <div>
                <p className="text-gray-600">Created</p>
                <p className="font-medium">{new Date(vehicle.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-gray-600">Last Updated</p>
                <p className="font-medium">{new Date(vehicle.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      {vehicle.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{vehicle.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}