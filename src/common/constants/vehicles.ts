export const VEHICLE_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
  'Dodge', 'Ferrari', 'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai',
  'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover',
  'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'Mercedes-Benz', 'MINI',
  'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota',
  'Volkswagen', 'Volvo'
] as const;

export const VEHICLE_CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

export const TRANSMISSION_TYPES = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'cvt', label: 'CVT' },
] as const;

export const FUEL_TYPES = [
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'plugin_hybrid', label: 'Plug-in Hybrid' },
] as const;

export const VEHICLE_COLORS = [
  'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown',
  'Orange', 'Yellow', 'Purple', 'Gold', 'Beige', 'Burgundy', 'Navy',
  'Maroon', 'Teal', 'Turquoise', 'Pink', 'Other'
] as const;

export const CURRENT_YEAR = new Date().getFullYear();
export const MIN_YEAR = 1900;
export const MAX_YEAR = CURRENT_YEAR + 1;

export const PRICE_RANGES = [
  { min: 0, max: 5000, label: 'Under $5,000' },
  { min: 5000, max: 10000, label: '$5,000 - $10,000' },
  { min: 10000, max: 20000, label: '$10,000 - $20,000' },
  { min: 20000, max: 30000, label: '$20,000 - $30,000' },
  { min: 30000, max: 50000, label: '$30,000 - $50,000' },
  { min: 50000, max: 100000, label: '$50,000 - $100,000' },
  { min: 100000, max: Infinity, label: 'Over $100,000' },
] as const;