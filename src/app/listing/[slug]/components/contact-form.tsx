'use client';

import { useState } from 'react';
import { Button, Input, Card, Alert } from '@/common/components/ui';
import { VehicleWithImages } from '@/vehicle/models/vehicle.model';

interface ContactFormProps {
  vehicle: VehicleWithImages;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  inquiryType: 'general' | 'test_drive' | 'financing' | 'inspection';
}

export function ContactForm({ vehicle }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: `Hi, I'm interested in your ${vehicle.year} ${vehicle.make} ${vehicle.model}. Please contact me with more information.`,
    inquiryType: 'general',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit inquiry');
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: `Hi, I'm interested in your ${vehicle.year} ${vehicle.make} ${vehicle.model}. Please contact me with more information.`,
        inquiryType: 'general',
      });
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formattedPrice = vehicle.price ? new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(vehicle.price) : 'Price on request';

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Contact Seller</h2>
        <div className="text-2xl font-bold text-blue-600 mb-4">
          {formattedPrice}
        </div>
        <p className="text-gray-600 text-sm">
          Interested in this vehicle? Send a message to the seller.
        </p>
      </div>

      {submitStatus === 'success' && (
        <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Message sent successfully! The seller will contact you soon.
              </p>
            </div>
          </div>
        </Alert>
      )}

      {submitStatus === 'error' && (
        <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {errorMessage || 'Failed to send message. Please try again.'}
              </p>
            </div>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-1">
            I'm interested in
          </label>
          <select
            id="inquiryType"
            value={formData.inquiryType}
            onChange={(e) => handleInputChange('inquiryType', e.target.value as FormData['inquiryType'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="general">General Information</option>
            <option value="test_drive">Scheduling a Test Drive</option>
            <option value="financing">Financing Options</option>
            <option value="inspection">Vehicle Inspection</option>
          </select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            placeholder="Your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            placeholder="Tell the seller what you're looking for..."
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending Message...' : 'Send Message'}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          By submitting this form, you agree to be contacted by the seller regarding this vehicle.
        </div>
      </form>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              handleInputChange('inquiryType', 'test_drive');
              handleInputChange('message', `Hi, I'd like to schedule a test drive for your ${vehicle.year} ${vehicle.make} ${vehicle.model}. When would be a good time?`);
            }}
          >
            🚗 Schedule Test Drive
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              handleInputChange('inquiryType', 'financing');
              handleInputChange('message', `Hi, I'm interested in financing options for your ${vehicle.year} ${vehicle.make} ${vehicle.model}. Could you provide more details?`);
            }}
          >
            💳 Ask About Financing
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              handleInputChange('inquiryType', 'inspection');
              handleInputChange('message', `Hi, I'd like to arrange a professional inspection for your ${vehicle.year} ${vehicle.make} ${vehicle.model}. Is this possible?`);
            }}
          >
            🔍 Request Inspection
          </Button>
        </div>
      </div>
    </Card>
  );
}