'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/common/components/ui';
import { useAuth } from '@/common/components/providers';
import type { VehicleWithImages } from '@/vehicle/models/vehicle.model';
import { Car, Plus, Edit, Eye, MoreVertical, Filter, Search } from 'lucide-react';

type FilterStatus = 'all' | 'active' | 'pending' | 'sold' | 'archived';

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles');
        if (response.ok) {
          const data = await response.json();
          setVehicles(data.vehicles || []);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchVehicles();
    }
  }, [user]);

  useEffect(() => {
    let filtered = vehicles;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === filter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vehicle =>
        `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(query) ||
        vehicle.vin?.toLowerCase().includes(query)
      );
    }

    setFilteredVehicles(filtered);
  }, [vehicles, filter, searchQuery]);

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

  const filterCounts = {
    all: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    pending: vehicles.filter(v => v.status === 'pending').length,
    sold: vehicles.filter(v => v.status === 'sold').length,
    archived: vehicles.filter(v => v.status === 'archived').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Vehicles</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your vehicle listings
          </p>
        </div>
        <Link href="/dashboard/vehicles/create">
          <Button className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filters */}
            <div className="flex space-x-2">
              {Object.entries(filterCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as FilterStatus)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === status
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {vehicles.length === 0 ? 'No vehicles yet' : 'No vehicles match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {vehicles.length === 0 
                ? 'Start by adding your first vehicle listing'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {vehicles.length === 0 && (
              <Link href="/dashboard/vehicles/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Vehicle
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative">
                  <div className="w-full h-48 bg-gray-200 rounded-t-xl flex items-center justify-center">
                    {vehicle.images.length > 0 ? (
                      <img
                        src={vehicle.images.find(img => img.isPrimary)?.originalUrl || vehicle.images[0]?.originalUrl}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover rounded-t-xl"
                      />
                    ) : (
                      <Car className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    {vehicle.price && (
                      <p className="text-xl font-bold text-blue-600">
                        {formatPrice(vehicle.price)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {vehicle.mileage && (
                      <p>{vehicle.mileage.toLocaleString()} miles</p>
                    )}
                    {vehicle.condition && (
                      <p>Condition: {vehicle.condition}</p>
                    )}
                    {vehicle.location && (
                      <p>Location: {vehicle.location}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                    
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}