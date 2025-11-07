'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Download, ChevronDown, ChevronUp, Edit2, Save, X, Trash2, RefreshCw, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import EditableEstimateRow from './EditableEstimateRow';
import RegenerateQuoteDialog from './RegenerateQuoteDialog';

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
  model_used?: string;
  scenario_justification?: string;
}

interface EstimateTableProps {
  estimate: EstimateData;
  projectTitle?: string;
  projectDescription?: string;
  onRegenerate?: () => void;
}

export default function EstimateTable({ estimate, projectTitle, projectDescription, onRegenerate }: EstimateTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([0]));
  const [isEditing, setIsEditing] = useState(false);
  const [editedEstimate, setEditedEstimate] = useState<EstimateData>(estimate);
  const [isSaving, setIsSaving] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  const toggleCategory = (index: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCategories(newExpanded);
  };

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

  const recalculateTotals = (categories: EstimateCategory[]) => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    const updatedCategories = categories.map(category => {
      let catSubtotalHT = 0;
      let catSubtotalTVA = 0;
      let catSubtotalTTC = 0;

      const updatedItems = category.items.map(item => {
        const amountHT = item.quantity * item.unit_price_ht;
        const tvaAmount = amountHT * (item.tva_percent / 100);
        const amountTTC = amountHT + tvaAmount;

        catSubtotalHT += amountHT;
        catSubtotalTVA += tvaAmount;
        catSubtotalTTC += amountTTC;

        return {
          ...item,
          amount_ht: amountHT,
          tva_amount: tvaAmount,
          amount_ttc: amountTTC
        };
      });

      totalHT += catSubtotalHT;
      totalTVA += catSubtotalTVA;
      totalTTC += catSubtotalTTC;

      return {
        ...category,
        items: updatedItems,
        subtotal_ht: catSubtotalHT,
        subtotal_tva: catSubtotalTVA,
        subtotal_ttc: catSubtotalTTC
      };
    });

    return {
      categories: updatedCategories,
      total_ht: totalHT,
      total_tva: totalTVA,
      total_ttc: totalTTC
    };
  };

  const handleDeleteItem = (categoryIndex: number, itemIndex: number) => {
    const newCategories = [...editedEstimate.categories];
    newCategories[categoryIndex].items.splice(itemIndex, 1);

    if (newCategories[categoryIndex].items.length === 0) {
      newCategories.splice(categoryIndex, 1);
    }

    const recalculated = recalculateTotals(newCategories);
    setEditedEstimate({
      ...editedEstimate,
      ...recalculated
    });
  };

  const handleItemChange = (categoryIndex: number, itemIndex: number, field: keyof EstimateItem, value: any) => {
    const newCategories = [...editedEstimate.categories];
    newCategories[categoryIndex].items[itemIndex] = {
      ...newCategories[categoryIndex].items[itemIndex],
      [field]: value
    };

    const recalculated = recalculateTotals(newCategories);
    setEditedEstimate({
      ...editedEstimate,
      ...recalculated
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('estimates')
        .update({
          categories: editedEstimate.categories,
          total_ht: editedEstimate.total_ht,
          total_tva: editedEstimate.total_tva,
          total_ttc: editedEstimate.total_ttc,
          total_amount: editedEstimate.total_ttc
        })
        .eq('id', estimate.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      console.error('Error saving changes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      alert(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedEstimate(estimate);
    setIsEditing(false);
  };

  const displayEstimate = isEditing ? editedEstimate : estimate;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg sm:text-xl">Scénario {getScenarioLabel(estimate.scenario_type)}</CardTitle>
              <Badge className={`${getScenarioBadgeColor(estimate.scenario_type)} text-sm sm:text-base whitespace-nowrap`}>
                {formatCurrency(displayEstimate.total_ttc)}
              </Badge>
              {isEditing && displayEstimate.total_ttc !== estimate.total_ttc && (
                <Badge variant="outline" className="text-xs sm:text-sm">
                  Modifié
                </Badge>
              )}
            </div>
            {projectTitle && (
              <CardDescription className="text-sm sm:text-base">
                <span className="font-semibold">Projet:</span> {projectTitle}
              </CardDescription>
            )}
            {estimate.estimate_number && (
              <CardDescription className="text-xs sm:text-sm flex flex-col sm:flex-row sm:gap-2">
                <span><span className="font-semibold">N° Devis:</span> {estimate.estimate_number}</span>
                <span><span className="font-semibold">Date:</span> {formatDate(estimate.estimate_date)}</span>
                <span><span className="font-semibold">Validité:</span> {estimate.validity_days || 30} jours</span>
              </CardDescription>
            )}
            {estimate.model_used && (
              <CardDescription className="text-xs sm:text-sm">
                <span className="font-semibold">Généré par:</span> {estimate.model_used}
              </CardDescription>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-xs sm:text-sm"
                >
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Modifier
                </Button>
                {projectDescription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRegenerateDialog(true)}
                    className="text-xs sm:text-sm border-blue-300 text-blue-700 hover:bg-blue-50"
                    title="Régénérer avec un modèle IA plus performant"
                  >
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Meilleur modèle
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="text-xs sm:text-sm"
                >
                  {isSaving ? (
                    <>
                      <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="text-xs sm:text-sm"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Annuler
                </Button>
              </>
            )}
          </div>
        </div>

        {displayEstimate.scenario_justification && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">💡 Pourquoi ce scénario?</span> {estimate.scenario_justification}
            </p>
          </div>
        )}

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:grid-cols-3">
              <TabsTrigger value="client" className="text-xs sm:text-sm">Client</TabsTrigger>
              <TabsTrigger value="detailed" className="text-xs sm:text-sm">Détaillée</TabsTrigger>
              <TabsTrigger value="internal" className="text-xs sm:text-sm">Interne</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </Tabs>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 px-2 sm:px-6">
        {displayEstimate.categories.map((category, catIndex) => {
          const isExpanded = expandedCategories.has(catIndex);

          return (
            <div key={catIndex} className="space-y-2 sm:space-y-3">
              <button
                onClick={() => toggleCategory(catIndex)}
                className="w-full bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded-md hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-sm sm:text-lg">{category.name}</h3>
                    {category.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-bold text-xs sm:text-base text-blue-700 whitespace-nowrap">
                      {formatCurrency(category.subtotal_ttc)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
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
                          {isEditing && <th className="text-center p-3 font-semibold text-sm w-12"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {displayEstimate.categories[catIndex].items.map((item, itemIndex) => (
                          <EditableEstimateRow
                            key={itemIndex}
                            item={item}
                            itemIndex={itemIndex}
                            categoryIndex={catIndex}
                            isEditing={isEditing}
                            viewMode={viewMode}
                            onItemChange={handleItemChange}
                            onDelete={handleDeleteItem}
                            formatCurrency={formatCurrency}
                            calculateMargin={calculateMargin}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-2">
                    {category.items.map((item, itemIndex) => {
                      const margin = viewMode === 'internal' ? calculateMargin(item) : null;
                      return (
                        <div
                          key={itemIndex}
                          className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{item.poste}</h4>
                              {viewMode !== 'client' && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                              )}
                            </div>
                            <span className="font-bold text-blue-700 text-sm whitespace-nowrap">
                              {formatCurrency(item.amount_ttc)}
                            </span>
                          </div>

                          {viewMode !== 'client' && (
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                              <div>
                                <span className="text-gray-500">Quantité:</span>
                                <span className="ml-1 font-medium">{item.quantity} {item.unit}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">PU HT:</span>
                                <span className="ml-1 font-medium">{formatCurrency(item.unit_price_ht)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Montant HT:</span>
                                <span className="ml-1 font-medium">{formatCurrency(item.amount_ht)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">TVA:</span>
                                <span className="ml-1 font-medium">{item.tva_percent}%</span>
                              </div>
                            </div>
                          )}

                          {viewMode === 'detailed' && (item.materials_cost || item.labor_cost) && (
                            <div className="text-xs text-gray-500 pt-2 border-t space-y-1">
                              {item.materials_cost && (
                                <div>Matériaux: {formatCurrency(item.materials_cost)}</div>
                              )}
                              {item.labor_cost && (
                                <div>Main-d'œuvre: {formatCurrency(item.labor_cost)}</div>
                              )}
                            </div>
                          )}

                          {viewMode === 'internal' && margin && (
                            <div className="text-xs pt-2 border-t grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-500">Marge:</span>
                                <span className="ml-1 font-semibold text-green-700">
                                  {formatCurrency(margin.margin)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Marge %:</span>
                                <span className="ml-1 font-semibold text-green-700">
                                  {margin.marginPercent.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded font-bold border-t-2 border-gray-300">
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span>Sous-total {category.name}</span>
                      <div className="flex flex-col items-end gap-0.5 sm:gap-1">
                        {viewMode !== 'client' && (
                          <div className="text-xs sm:text-sm text-gray-600">
                            HT: {formatCurrency(category.subtotal_ht)} + TVA: {formatCurrency(category.subtotal_tva)}
                          </div>
                        )}
                        <span className="text-blue-700">{formatCurrency(category.subtotal_ttc)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border-2 border-blue-200 space-y-2 sm:space-y-3">
          <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4">Récapitulatif</h3>
          {viewMode !== 'client' && (
            <>
              <div className="flex justify-between text-sm sm:text-lg">
                <span>Total HT:</span>
                <span className="font-semibold">{formatCurrency(estimate.total_ht)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-lg">
                <span>Total TVA:</span>
                <span className="font-semibold">{formatCurrency(estimate.total_tva)}</span>
              </div>
            </>
          )}
          {estimate.discount_amount && estimate.discount_amount > 0 && (
            <>
              <div className="flex justify-between text-sm sm:text-lg text-green-700">
                <span>Remise ({estimate.discount_percent}%):</span>
                <span className="font-semibold">- {formatCurrency(estimate.discount_amount)}</span>
              </div>
              <div className="border-t pt-2"></div>
            </>
          )}
          <div className="flex justify-between text-xl sm:text-2xl font-bold text-blue-700 pt-2 border-t-2 border-blue-300">
            <span>Total TTC:</span>
            <span>{formatCurrency(estimate.total_ttc - (estimate.discount_amount || 0))}</span>
          </div>
          {viewMode === 'internal' && totalMargin() && (
            <div className="flex justify-between text-sm sm:text-lg text-green-700 pt-2 border-t">
              <span>Marge totale:</span>
              <span className="font-semibold">
                {formatCurrency(totalMargin()!.margin)} ({totalMargin()!.marginPercent.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        {(estimate.payment_terms || estimate.execution_delay || estimate.deposit_required || estimate.special_conditions) && (
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg space-y-2 sm:space-y-3">
            <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">Informations Devis</h3>
            {estimate.payment_terms && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold">Conditions de paiement:</span>
                <p className="text-gray-700 mt-1">{estimate.payment_terms}</p>
              </div>
            )}
            {estimate.execution_delay && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold">Délai d'exécution:</span>
                <p className="text-gray-700 mt-1">{estimate.execution_delay}</p>
              </div>
            )}
            {estimate.deposit_required && estimate.deposit_required > 0 && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold">Acompte demandé:</span>
                <p className="text-gray-700 mt-1">{estimate.deposit_required}% à la commande</p>
              </div>
            )}
            {estimate.special_conditions && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold">Conditions particulières:</span>
                <p className="text-gray-700 mt-1">{estimate.special_conditions}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {projectDescription && (
        <RegenerateQuoteDialog
          open={showRegenerateDialog}
          onOpenChange={setShowRegenerateDialog}
          estimateId={estimate.id}
          currentModel={estimate.model_used || 'Unknown'}
          currentTotal={estimate.total_ttc}
          scenarioType={estimate.scenario_type}
          projectDescription={projectDescription}
          onSuccess={() => {
            if (onRegenerate) {
              onRegenerate();
            }
          }}
        />
      )}
    </Card>
  );
}
