import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user first
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';

    // Simple mock data for now - this is much cleaner
    const mockData = {
      summary: {
        totalCost: 2.45,
        dailySpending: 0.12,
        monthlySpending: 2.45,
        byProvider: {
          flux: 1.20,
          replicate: 0.85,
          bytedance: 0.40
        }
      },
      records: [],
      limits: {
        dailyLimit: { current: 0.12, limit: 10.0, exceeded: false },
        monthlyLimit: { current: 2.45, limit: 100.0, exceeded: false },
        warnings: []
      },
      analytics: {
        dailySpending: [],
        modelBreakdown: [],
        totalSpent: 2.45
      }
    };

    return NextResponse.json(mockData[action as keyof typeof mockData] || mockData.summary);
  } catch (error) {
    console.error('Error in cost tracking API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user first
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    // Handle different actions
    switch (action) {
      case 'record':
        // Record a new cost
        console.log('Recording cost:', data);
        return NextResponse.json({ success: true, id: `cost_${Date.now()}` });
      
      case 'reconcile':
        // Reconcile costs
        console.log('Reconciling costs:', data);
        return NextResponse.json({ 
          reconciled: 0, 
          totalDifference: 0, 
          averageAccuracy: 1 
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in cost tracking API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}