'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft, Shield, Database, TrendingUp, Users, Sparkles, Settings, Activity, ChevronRight, CircleCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function AdminDashboard() {
  const { loading } = useAuthGuard({ requireAdmin: true });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalApiCalls: 0,
    totalCost: 0,
  });

  useEffect(() => {
    if (loading) return;
    loadStats();
  }, [loading]);

  const loadStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: subsCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: apiCallsCount } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true });

      const { data: costData } = await supabase
        .from('api_usage_logs')
        .select('cost');

      const totalCost = costData?.reduce((sum, log) => sum + (parseFloat(log.cost) || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        activeSubscriptions: subsCount || 0,
        totalApiCalls: apiCallsCount || 0,
        totalCost: totalCost,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Administration</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Centre de contrôle</p>
            <h1 className="mt-1 text-3xl font-bold text-foreground">Administration Devisia</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Surveillez l’activité, pilotez les offres et choisissez le modèle IA utilisé par chaque formule.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-300">
            <CircleCheck className="h-4 w-4" aria-hidden="true" />
            Accès administrateur vérifié
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Utilisateurs inscrits</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abonnements</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Abonnements actifs</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appels API</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApiCalls}</div>
              <p className="text-xs text-muted-foreground">Requetes totales</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cout Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCost.toFixed(2)} EUR</div>
              <p className="text-xs text-muted-foreground">Cout API cumule</p>
            </CardContent>
          </Card>
        </div>

        <section aria-labelledby="admin-actions-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 id="admin-actions-title" className="text-xl font-semibold text-foreground">Actions principales</h2>
              <p className="mt-1 text-sm text-muted-foreground">Les réglages les plus utiles, accessibles sans détour.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/admin/subscriptions" className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Card className="h-full border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card transition-all group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-lg bg-primary/15 p-2.5 text-primary"><Sparkles className="h-5 w-5" aria-hidden="true" /></div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                  <CardTitle className="pt-2">Offres &amp; modèles IA</CardTitle>
                  <CardDescription>Changez en quelques secondes le modèle utilisé par Starter, Business et Pro.</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/models" className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-lg bg-muted p-2.5 text-foreground"><Database className="h-5 w-5" aria-hidden="true" /></div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                  <CardTitle className="pt-2">Catalogue des modèles</CardTitle>
                  <CardDescription>Activez, documentez et contrôlez les modèles proposés dans les offres.</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/usage" className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-lg bg-muted p-2.5 text-foreground"><Activity className="h-5 w-5" aria-hidden="true" /></div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                  <CardTitle className="pt-2">Utilisation &amp; coûts</CardTitle>
                  <CardDescription>Analysez les appels, les erreurs, les volumes de tokens et les coûts.</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/config" className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-lg bg-muted p-2.5 text-foreground"><Settings className="h-5 w-5" aria-hidden="true" /></div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                  <CardTitle className="pt-2">Configuration système</CardTitle>
                  <CardDescription>Consultez les réglages applicatifs réservés aux super-administrateurs.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
