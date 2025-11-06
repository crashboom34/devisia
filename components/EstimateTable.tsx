'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Download } from 'lucide-react';

type ViewMode = 'client' | 'detailed' | 'internal';

interface EstimateItem {
  poste: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_ht: number;
  amount_ht: number;
  tva_percent: number;
  tva_amount: number;
  amount_ttc: number;
  materials_cost?: number;
  labor_cost?: number;
  cost_price?: number;
  sell_price?: number;
}

interface EstimateCategory {
  name: string;
  description: string;
  items: EstimateItem[];
  subtotal_ht: number;
  subtotal_tva: number;
  subtotal_ttc: number;
}

interface EstimateData {
  id: string;
  scenario_type: string;
  estimate_number?: string;
  client_name?: string;
  estimate_date?: string;
  validity_days?: number;
  payment_terms?: string;
  execution_delay?: string;
  deposit_required?: number;
  special_conditions?: string;
  categories: EstimateCategory[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  discount_amount?: number;
  discount_percent?: number;
}

interface EstimateTableProps {
  estimate: EstimateData;
  projectTitle?: string;
}

export default function EstimateTable({ estimate, projectTitle }: EstimateTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');

  const getScenarioLabel = (type: string) => {
    switch (type) {
      case 'eco':
        return 'Économique';
      case 'standard':
        return 'Standard';
      case 'premium':
        return 'Premium';
      default:
        return type;
    }
  };

  const getScenarioBadgeColor = (type: string) => {
    switch (type) {
      case 'eco':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'standard':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'premium':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('fr-FR');
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculateMargin = (item: EstimateItem) => {
    if (!item.cost_price || !item.sell_price) return null;
    const margin = item.sell_price - item.cost_price;
    const marginPercent = (margin / item.sell_price) * 100;
    return { margin, marginPercent };
  };

  const totalMargin = () => {
    let totalCost = 0;
    let totalSell = 0;

    estimate.categories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.cost_price && item.sell_price) {
          totalCost += item.cost_price;
          totalSell += item.sell_price;
        }
      });
    });

    if (totalSell === 0) return null;
    const margin = totalSell - totalCost;
    const marginPercent = (margin / totalSell) * 100;
    return { margin, marginPercent };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle>Scénario {getScenarioLabel(estimate.scenario_type)}</CardTitle>
              <Badge className={getScenarioBadgeColor(estimate.scenario_type)}>
                {formatCurrency(estimate.total_ttc)}
              </Badge>
            </div>
            {projectTitle && (
              <CardDescription className="text-base">
                <span className="font-semibold">Projet:</span> {projectTitle}
              </CardDescription>
            )}
            {estimate.estimate_number && (
              <CardDescription>
                <span className="font-semibold">N° Devis:</span> {estimate.estimate_number} |
                <span className="font-semibold ml-2">Date:</span> {formatDate(estimate.estimate_date)} |
                <span className="font-semibold ml-2">Validité:</span> {estimate.validity_days || 30} jours
              </CardDescription>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="client">Vue Client</TabsTrigger>
                <TabsTrigger value="detailed">Vue Détaillée</TabsTrigger>
                <TabsTrigger value="internal">Vue Interne</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {estimate.categories.map((category, catIndex) => (
          <div key={catIndex} className="space-y-3">
            <div className="bg-gray-100 px-4 py-2 rounded-md">
              <h3 className="font-bold text-lg">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-600">{category.description}</p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold text-sm">Poste</th>
                    {viewMode !== 'client' && (
                      <>
                        <th className="text-left p-3 font-semibold text-sm">Description</th>
                        <th className="text-center p-3 font-semibold text-sm">Qté</th>
                        <th className="text-center p-3 font-semibold text-sm">Unité</th>
                        <th className="text-right p-3 font-semibold text-sm">PU HT</th>
                        <th className="text-right p-3 font-semibold text-sm">Montant HT</th>
                        <th className="text-center p-3 font-semibold text-sm">TVA</th>
                      </>
                    )}
                    <th className="text-right p-3 font-semibold text-sm">Montant TTC</th>
                    {viewMode === 'internal' && (
                      <>
                        <th className="text-right p-3 font-semibold text-sm">Marge €</th>
                        <th className="text-right p-3 font-semibold text-sm">Marge %</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {category.items.map((item, itemIndex) => {
                    const margin = viewMode === 'internal' ? calculateMargin(item) : null;
                    return (
                      <tr
                        key={itemIndex}
                        className={`border-b ${itemIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                      >
                        <td className="p-3 font-medium">{item.poste}</td>
                        {viewMode !== 'client' && (
                          <>
                            <td className="p-3 text-sm max-w-xs">
                              {item.description}
                              {viewMode === 'detailed' && (item.materials_cost || item.labor_cost) && (
                                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                  {item.materials_cost && (
                                    <div>Matériaux: {formatCurrency(item.materials_cost)}</div>
                                  )}
                                  {item.labor_cost && (
                                    <div>Main-d'œuvre: {formatCurrency(item.labor_cost)}</div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-center text-sm">{item.unit}</td>
                            <td className="p-3 text-right">{formatCurrency(item.unit_price_ht)}</td>
                            <td className="p-3 text-right font-semibold">{formatCurrency(item.amount_ht)}</td>
                            <td className="p-3 text-center text-sm">{item.tva_percent}%</td>
                          </>
                        )}
                        <td className="p-3 text-right font-bold text-blue-700">
                          {formatCurrency(item.amount_ttc)}
                        </td>
                        {viewMode === 'internal' && margin && (
                          <>
                            <td className="p-3 text-right text-green-700 font-semibold">
                              {formatCurrency(margin.margin)}
                            </td>
                            <td className="p-3 text-right text-green-700 font-semibold">
                              {margin.marginPercent.toFixed(1)}%
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td className="p-3" colSpan={viewMode === 'client' ? 1 : viewMode === 'detailed' ? 5 : 7}>
                      Sous-total {category.name}
                    </td>
                    {viewMode !== 'client' && (
                      <>
                        <td className="p-3 text-right">{formatCurrency(category.subtotal_ht)}</td>
                        <td className="p-3 text-center">-</td>
                      </>
                    )}
                    <td className="p-3 text-right text-blue-700">
                      {formatCurrency(category.subtotal_ttc)}
                    </td>
                    {viewMode === 'internal' && (
                      <>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                      </>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}

        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 space-y-3">
          <h3 className="font-bold text-xl mb-4">Récapitulatif</h3>
          {viewMode !== 'client' && (
            <>
              <div className="flex justify-between text-lg">
                <span>Total HT:</span>
                <span className="font-semibold">{formatCurrency(estimate.total_ht)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Total TVA:</span>
                <span className="font-semibold">{formatCurrency(estimate.total_tva)}</span>
              </div>
            </>
          )}
          {estimate.discount_amount && estimate.discount_amount > 0 && (
            <>
              <div className="flex justify-between text-lg text-green-700">
                <span>Remise ({estimate.discount_percent}%):</span>
                <span className="font-semibold">- {formatCurrency(estimate.discount_amount)}</span>
              </div>
              <div className="border-t pt-2"></div>
            </>
          )}
          <div className="flex justify-between text-2xl font-bold text-blue-700 pt-2 border-t-2 border-blue-300">
            <span>Total TTC:</span>
            <span>{formatCurrency(estimate.total_ttc - (estimate.discount_amount || 0))}</span>
          </div>
          {viewMode === 'internal' && totalMargin() && (
            <div className="flex justify-between text-lg text-green-700 pt-2 border-t">
              <span>Marge totale:</span>
              <span className="font-semibold">
                {formatCurrency(totalMargin()!.margin)} ({totalMargin()!.marginPercent.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        {(estimate.payment_terms || estimate.execution_delay || estimate.deposit_required || estimate.special_conditions) && (
          <div className="bg-gray-50 p-6 rounded-lg space-y-3">
            <h3 className="font-bold text-lg mb-3">Informations Devis</h3>
            {estimate.payment_terms && (
              <div>
                <span className="font-semibold">Conditions de paiement:</span>
                <p className="text-gray-700">{estimate.payment_terms}</p>
              </div>
            )}
            {estimate.execution_delay && (
              <div>
                <span className="font-semibold">Délai d'exécution:</span>
                <p className="text-gray-700">{estimate.execution_delay}</p>
              </div>
            )}
            {estimate.deposit_required && estimate.deposit_required > 0 && (
              <div>
                <span className="font-semibold">Acompte demandé:</span>
                <p className="text-gray-700">{estimate.deposit_required}% à la commande</p>
              </div>
            )}
            {estimate.special_conditions && (
              <div>
                <span className="font-semibold">Conditions particulières:</span>
                <p className="text-gray-700">{estimate.special_conditions}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
