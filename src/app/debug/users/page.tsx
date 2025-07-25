'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  user_metadata: any;
  app_metadata: any;
}

export default function UsersDebugPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase Users Debug</h1>
          <p className="text-gray-600">View all users in the Supabase database</p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={fetchUsers} 
            disabled={loading}
            variant="default"
          >
            {loading ? 'Loading...' : 'Refresh Users'}
          </Button>
        </div>

        {error && (
          <GlassCard className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-600">Error: {error}</p>
          </GlassCard>
        )}

        {users.length === 0 && !loading && !error && (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-500">No users found in the database</p>
          </GlassCard>
        )}

        <div className="grid gap-4">
          {users.map((user) => (
            <GlassCard key={user.id} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">ID:</span>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {user.id}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <span className="ml-2">{user.email}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Created:</span>
                      <span className="ml-2">
                        {new Date(user.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Last Sign In:</span>
                      <span className="ml-2">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email Confirmed:</span>
                      <span className="ml-2">
                        {user.email_confirmed_at 
                          ? new Date(user.email_confirmed_at).toLocaleString()
                          : 'Not confirmed'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Metadata</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">User Metadata:</span>
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(user.user_metadata, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">App Metadata:</span>
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(user.app_metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {users.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">Total users: {users.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}