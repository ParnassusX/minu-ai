import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // SECURITY: Test auth endpoint is disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints are not available in production' },
      { status: 404 }
    );
  }

  // SECURITY: Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoints are only available in development' },
      { status: 403 }
    );
  }

  // SECURITY: Additional localhost check for extra protection
  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return NextResponse.json(
      { error: 'Test endpoints are only accessible from localhost' },
      { status: 403 }
    );
  }

  try {
    const { email, password, fullName } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Create user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Test User'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      }
    });
  } catch (error) {
    console.error('Error in create user API:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // SECURITY: Test auth endpoint is disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints are not available in production' },
      { status: 404 }
    );
  }

  // SECURITY: Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoints are only available in development' },
      { status: 403 }
    );
  }

  // SECURITY: Additional localhost check for extra protection
  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return NextResponse.json(
      { error: 'Test endpoints are only accessible from localhost' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'POST to this endpoint with { email, password, fullName } to create a test user',
    environment: process.env.NODE_ENV,
    warning: 'This is a development-only test endpoint'
  });
}