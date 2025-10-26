'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<any>({});

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const results: any = {};

    // Test 1: Variables d'environnement
    results.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
    results.hasAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'YES' : 'NO';

    // Test 2: Connexion basique
    try {
      const { data, error } = await supabase.from('profiles').select('count');
      results.databaseConnection = error ? `ERROR: ${error.message}` : 'OK';
    } catch (err: any) {
      results.databaseConnection = `EXCEPTION: ${err.message}`;
    }

    // Test 3: Auth status
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      results.authSession = session ? 'Logged in' : 'Not logged in';
      results.authError = error?.message || 'None';
    } catch (err: any) {
      results.authSession = `EXCEPTION: ${err.message}`;
    }

    // Test 4: Test d'inscription
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',
      });
      results.signUpTest = error ? `ERROR: ${error.message}` : 'OK';
    } catch (err: any) {
      results.signUpTest = `EXCEPTION: ${err.message}`;
    }

    setStatus(results);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Test de Connexion Supabase</h1>

        <div className="space-y-2">
          {Object.entries(status).map(([key, value]) => (
            <div key={key} className="border-b pb-2">
              <span className="font-semibold">{key}:</span>{' '}
              <span className={
                String(value).includes('ERROR') || String(value).includes('EXCEPTION') || String(value).includes('MISSING')
                  ? 'text-red-600'
                  : 'text-green-600'
              }>
                {String(value)}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={testConnection}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Re-tester
        </button>
      </div>
    </div>
  );
}
