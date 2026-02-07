'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Cpu, FileText, Users, Crown, Check, Zap } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tierLevel: 1,
    price: '9,99',
    icon: FileText,
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-500/30',
    aiModel: 'GPT-4.1 Mini',
    maxProjects: 10,
    maxClients: 20,
    features: [
      'Devis IA avec GPT-4.1 Mini',
      'Logo, mentions legales et TVA',
      'Historique des devis',
      'Support par email',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tierLevel: 2,
    price: '19,99',
    icon: Users,
    color: 'bg-sky-500',
    borderColor: 'border-sky-500/30',
    aiModel: 'Mistral Large 2',
    maxProjects: 30,
    maxClients: 60,
    features: [
      'Devis IA avec Mistral Large 2',
      'Gestion complete des clients',
      'Exports PDF illimites',
      'Transformation devis en factures',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tierLevel: 3,
    price: '29,99',
    icon: Crown,
    color: 'bg-amber-500',
    borderColor: 'border-amber-500/30',
    aiModel: 'GPT-4.1',
    maxProjects: -1,
    maxClients: -1,
    features: [
      'Devis IA avec GPT-4.1 Premium',
      'Devis et clients illimites',
      'Collaboration d\'equipe',
      'Support prioritaire',
    ],
  },
];

export default function AdminPlanPreview() {
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const selectedPlan = PLANS.find((p) => p.id === activePlan);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <CardTitle>Previsualisation des plans</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Basculez entre les plans pour voir l&apos;experience client de chaque abonnement.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isActive = activePlan === plan.id;
            return (
              <Button
                key={plan.id}
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActivePlan(isActive ? null : plan.id)}
                className={isActive ? `${plan.color} text-white hover:opacity-90` : ''}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {plan.name}
              </Button>
            );
          })}
        </div>

        {selectedPlan ? (
          <div className={`rounded-xl border-2 ${selectedPlan.borderColor} bg-white p-6 space-y-5 transition-all`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedPlan.color}`}>
                  <selectedPlan.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedPlan.name}</h3>
                  <p className="text-sm text-gray-500">{selectedPlan.price} EUR/mois</p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Cpu className="h-3 w-3" />
                {selectedPlan.aiModel}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {selectedPlan.maxProjects === -1 ? 'Illimite' : selectedPlan.maxProjects}
                </p>
                <p className="text-xs text-gray-500">Devis/mois</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {selectedPlan.maxClients === -1 ? 'Illimite' : selectedPlan.maxClients}
                </p>
                <p className="text-xs text-gray-500">Clients</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">Tier {selectedPlan.tierLevel}</p>
                <p className="text-xs text-gray-500">Niveau IA</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                Fonctionnalites incluses
              </h4>
              <ul className="space-y-1.5">
                {selectedPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
            <Eye className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              Selectionnez un plan ci-dessus pour previsualiser l&apos;experience client.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
