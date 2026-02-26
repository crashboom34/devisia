'use client';
/* eslint-disable react/no-unescaped-entities, react-hooks/exhaustive-deps */

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface APIUsageLog {
  id: string;
  user_id: string;
  project_id: string | null;
  provider: string;
  endpoint: string;
  model_used: string | null;
  tokens_input: number;
  tokens_output: number;
  cost: number;
  duration_ms: number;
  status: string;
  error_message: string | null;
  created_at: string;
  profiles?: {
    email: string;
  };
}

export default function AdminUsagePage() {
  const router = useRouter();
  const [logs, setLogs] = useState<APIUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    checkAdmin();
    loadLogs();
  }, [filter, limit]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminData) {
      router.push('/admin');
      return;
    }

    setLoading(false);
  };

  const loadLogs = async () => {
    let query = supabase
      .from('api_usage_logs')
      .select(`
        *,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading logs:', error);
    } else {
      setLogs(data || []);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 text-xs rounded bg-green-200 text-green-700">Success</span>;
      case 'error':
        return <span className="px-2 py-1 text-xs rounded bg-red-200 text-red-700">Error</span>;
      case 'rate_limited':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-200 text-yellow-700">Rate Limited</span>;
      case 'timeout':
        return <span className="px-2 py-1 text-xs rounded bg-orange-200 text-orange-700">Timeout</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">{status}</span>;
    }
  };

  const totalCost = logs.reduce((sum, log) => sum + parseFloat(log.cost?.toString() || '0'), 0);
  const totalTokensInput = logs.reduce((sum, log) => sum + (log.tokens_input || 0), 0);
  const totalTokensOutput = logs.reduce((sum, log) => sum + (log.tokens_output || 0), 0);

  const periodStats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7 = logs.filter(l => new Date(l.created_at) >= sevenDaysAgo);
    const last30 = logs.filter(l => new Date(l.created_at) >= thirtyDaysAgo);

    return {
      week: {
        cost: last7.reduce((s, l) => s + parseFloat(l.cost?.toString() || '0'), 0),
        tokensIn: last7.reduce((s, l) => s + (l.tokens_input || 0), 0),
        tokensOut: last7.reduce((s, l) => s + (l.tokens_output || 0), 0),
        calls: last7.length,
      },
      month: {
        cost: last30.reduce((s, l) => s + parseFloat(l.cost?.toString() || '0'), 0),
        tokensIn: last30.reduce((s, l) => s + (l.tokens_input || 0), 0),
        tokensOut: last30.reduce((s, l) => s + (l.tokens_output || 0), 0),
        calls: last30.length,
      },
    };
  }, [logs]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Logs d&apos;Utilisation API</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cout Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tokens Input</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTokensInput.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tokens Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTokensOutput.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Totaux 7 derniers jours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Appels</p>
                  <p className="text-lg font-semibold">{periodStats.week.calls}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cout</p>
                  <p className="text-lg font-semibold">{formatCurrency(periodStats.week.cost)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tokens In</p>
                  <p className="text-lg font-semibold">{periodStats.week.tokensIn.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tokens Out</p>
                  <p className="text-lg font-semibold">{periodStats.week.tokensOut.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Totaux 30 derniers jours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Appels</p>
                  <p className="text-lg font-semibold">{periodStats.month.calls}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cout</p>
                  <p className="text-lg font-semibold">{formatCurrency(periodStats.month.cost)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tokens In</p>
                  <p className="text-lg font-semibold">{periodStats.month.tokensIn.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tokens Out</p>
                  <p className="text-lg font-semibold">{periodStats.month.tokensOut.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Logs API</CardTitle>
                <CardDescription>
                  Historique des appels API avec details
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="rate_limited">Rate Limited</SelectItem>
                    <SelectItem value="timeout">Timeout</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 lignes</SelectItem>
                    <SelectItem value="100">100 lignes</SelectItem>
                    <SelectItem value="200">200 lignes</SelectItem>
                    <SelectItem value="500">500 lignes</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={loadLogs}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Modele</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="text-right">Tokens In</TableHead>
                    <TableHead className="text-right">Tokens Out</TableHead>
                    <TableHead className="text-right">Cout</TableHead>
                    <TableHead className="text-right">Duree</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{formatDate(log.created_at)}</TableCell>
                      <TableCell className="text-sm">{log.profiles?.email || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{log.model_used || '-'}</TableCell>
                      <TableCell className="text-sm">{log.endpoint}</TableCell>
                      <TableCell className="text-right text-sm">{(log.tokens_input || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{(log.tokens_output || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm font-mono">{formatCurrency(log.cost || 0)}</TableCell>
                      <TableCell className="text-right text-sm">{log.duration_ms || 0}ms</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {logs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun log trouve</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
