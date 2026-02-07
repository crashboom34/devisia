'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, Users, Crown, Eye, Zap } from 'lucide-react';

const PLANS = [
  {
    id: 'unlimited',
    name: 'Admin Illimite',
    icon: Shield,
    color: 'bg-purple-600',
    description: 'Acces complet sans limitation',
  },
  {
    id: 'starter',
    name: 'Starter (Simulation)',
    icon: FileText,
    color: 'bg-emerald-600',
    description: 'GPT-4.1 Mini - 10 projets/mois',
  },
  {
    id: 'business',
    name: 'Business (Simulation)',
    icon: Users,
    color: 'bg-sky-600',
    description: 'Mistral Large 2 - 30 projets/mois',
  },
  {
    id: 'pro',
    name: 'Pro (Simulation)',
    icon: Crown,
    color: 'bg-amber-600',
    description: 'GPT-4.1 - Projets illimites',
  },
];

export default function AdminPlanSimulator() {
  const [currentMode, setCurrentMode] = useState<string>(() => {
    if (typeof window === 'undefined') return 'unlimited';
    return localStorage.getItem('admin_current_mode') || 'unlimited';
  });

  const switchMode = (modeId: string) => {
    setCurrentMode(modeId);
    localStorage.setItem('admin_current_mode', modeId);
    window.location.reload();
  };

  const currentPlan = PLANS.find((p) => p.id === currentMode) || PLANS[0];
  const Icon = currentPlan.icon;

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-50/5 to-purple-100/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              Mode Administrateur
            </CardTitle>
            <CardDescription className="mt-1.5">
              Choisissez votre mode de navigation
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {currentPlan.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            const isActive = currentMode === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => switchMode(plan.id)}
                className={`relative group rounded-lg border-2 p-4 text-left transition-all ${
                  isActive
                    ? `${plan.color} border-transparent text-white shadow-lg`
                    : 'border-gray-700 bg-slate-900/40 hover:border-gray-600 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <PlanIcon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {plan.id === 'unlimited' && (
                    <Zap className={`h-4 w-4 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                  )}
                </div>
                <h3 className={`font-semibold text-sm mb-1 ${isActive ? 'text-white' : 'text-gray-200'}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs ${isActive ? 'text-white/90' : 'text-gray-400'}`}>
                  {plan.description}
                </p>
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-purple-200">
              {currentMode === 'unlimited' ? (
                <span>
                  Vous etes en mode <strong>illimite</strong>. Aucune restriction ne s&apos;applique.
                </span>
              ) : (
                <span>
                  Vous simulez le plan <strong>{currentPlan.name}</strong>. Les limitations sont appliquees pour tester l&apos;experience utilisateur.
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
