'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, ArrowLeft, Shield, Database, TrendingUp, Users, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import AdminPlanPreview from '@/components/AdminPlanPreview';

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
        <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard Administrateur</h1>

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

        <Tabs defaultValue="models" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="models">Modeles IA</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
            <TabsTrigger value="usage">Utilisation</TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Preview Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle>Modeles IA Disponibles</CardTitle>
                <CardDescription>
                  Gerez les modeles IA disponibles pour les utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/models">
                  <Button>Gerer les modeles</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Systeme</CardTitle>
                <CardDescription>
                  Configurez les cles API et parametres systeme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/config">
                  <Button>Configuration systeme</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Abonnements</CardTitle>
                <CardDescription>
                  Gerez les tiers d&apos;abonnement et les souscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/subscriptions">
                  <Button>Gerer les abonnements</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Logs d&apos;Utilisation</CardTitle>
                <CardDescription>
                  Consultez les logs d&apos;utilisation des APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/usage">
                  <Button>Voir les logs</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <AdminPlanPreview />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
