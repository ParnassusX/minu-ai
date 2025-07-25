'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { CostBadge } from '@/components/cost-tracking/CostBadge';
import { SpendingDashboard } from '@/components/cost-tracking/SpendingDashboard';
import { CostAlert } from '@/components/cost-tracking/CostAlert';
import { Search, Zap, DollarSign } from 'lucide-react';

export default function DebugPage() {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestAction = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Minu.AI Component Testing</h1>
          <p className="text-gray-600">Test all the new UI components and cost tracking features</p>
        </div>

        {/* Glass Cards Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Glass Morphism Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard variant="default" className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Default Card</h3>
              <p className="text-gray-700">This is a default glass card with subtle transparency.</p>
            </GlassCard>
            
            <GlassCard variant="elevated" className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Elevated Card</h3>
              <p className="text-gray-700">This card has elevated glass effect with more blur.</p>
            </GlassCard>
            
            <GlassCard variant="interactive" className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Interactive Card</h3>
              <p className="text-gray-700">This card has hover effects and interactions.</p>
            </GlassCard>
          </div>
        </section>

        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Modern Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">
              <Zap className="h-4 w-4 mr-2" />
              Primary Button
            </Button>
            <Button variant="secondary">
              Secondary Button
            </Button>
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Outline Button
            </Button>
            <Button variant="ghost">
              Ghost Button
            </Button>
            <Button variant="destructive">
              Destructive Button
            </Button>
            <Button 
              variant="default" 
              onClick={handleTestAction}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Test Loading'}
            </Button>
          </div>
        </section>

        {/* Form Components Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Enhanced Form Components</h2>
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                helperText="Enter your email address"
              />
              <Input
                label="Password"
                type="password"
                variant="glass"
                helperText="Glass variant input"
              />
              <Input
                label="Error Example"
                error="This field has an error"
                defaultValue="Invalid input"
              />
              <Input
                label="Search"
                placeholder="Search something..."
              />
            </div>
          </GlassCard>
        </section>

        {/* Cost Tracking Components */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cost Tracking Components</h2>
          
          {/* Cost Badges */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Cost Badges</h3>
            <div className="flex flex-wrap gap-3">
              <CostBadge cost={0.025} provider="flux" showProvider />
              <CostBadge cost={0.0035} provider="replicate" showProvider />
              <CostBadge cost={0.12} provider="bytedance" showProvider />
              <CostBadge cost={0.0008} variant="success" />
              <CostBadge cost={0.25} variant="warning" />
              <CostBadge cost={1.50} variant="error" />
            </div>
          </div>

          {/* Cost Alerts */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Cost Alerts</h3>
            <CostAlert />
          </div>

          {/* Spending Dashboard */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Spending Dashboard</h3>
            <SpendingDashboard />
          </div>
        </section>

        {/* Test Results */}
        <section>
          <GlassCard className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🎉 Component Test Complete!</h3>
            <p className="text-gray-600 mb-4">
              All components are working properly. You can now integrate them into your main application.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="default" onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = '/generator'}>
                Try Generator
              </Button>
            </div>
          </GlassCard>
        </section>

      </div>
    </div>
  );
}