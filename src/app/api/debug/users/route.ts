import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // SECURITY: Debug endpoint is disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints are not available in production' },
      { status: 404 }
    );
  }

  // SECURITY: Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoints are only available in development' },
      { status: 403 }
    );
  }

  // SECURITY: Additional localhost check for extra protection
  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return NextResponse.json(
      { error: 'Debug endpoints are only accessible from localhost' },
      { status: 403 }
    );
  }

  try {
    const supabase = createServiceClient();

    // Query users from auth.users table
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return limited user information for debugging purposes only
    const userInfo = users.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at
      // Removed sensitive metadata for security
    }));

    return NextResponse.json({
      users: userInfo,
      total: users.users.length,
      environment: process.env.NODE_ENV,
      warning: 'This is a development-only debug endpoint'
    });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}