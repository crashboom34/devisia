'use client';
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Download, ChevronDown, ChevronUp, Edit2, Save, X, Trash2, History, BriefcaseBusiness } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import EditableEstimateRow from './EditableEstimateRow';
import { toast } from 'sonner';
import { buildClientEstimateExport } from '@/lib/client-estimate-export';
import {
  recalculateEstimateTotals,
  calculateMargin,
  calculateTotalMargin,
  formatCurrencyEUR as formatCurrency,
  type EstimateItem,
  type EstimateCategory,
} from '@/lib/pricing/engine';

type ViewMode = 'client' | 'detailed' | 'internal';

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
  quote_status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
}

interface EstimateTableProps {
  estimate: EstimateData;
  projectTitle?: string;
  projectDescription?: string;
  onRegenerate?: () => void;
  canCreateJob?: boolean;
}

export default function EstimateTable({ estimate, projectTitle, projectDescription, onRegenerate, canCreateJob = false }: EstimateTableProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([0]));
  const [isEditing, setIsEditing] = useState(false);
  const [editedEstimate, setEditedEstimate] = useState<EstimateData>(estimate);
  const [isSaving, setIsSaving] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const clientExport = buildClientEstimateExport({
    estimateNumber: estimate.estimate_number,
    projectTitle,
    clientName: estimate.client_name,
    estimateDate: estimate.estimate_date,
    validityDays: estimate.validity_days,
    paymentTerms: estimate.payment_terms,
    executionDelay: estimate.execution_delay,
    depositRequired: estimate.deposit_required,
    specialConditions: estimate.special_conditions,
    totalHt: estimate.total_ht,
    totalTva: estimate.total_tva,
    totalTtc: estimate.total_ttc,
    discountAmount: estimate.discount_amount,
    categories: estimate.categories,
  });

  useEffect(() => {
    if (!isPrinting) return;
    const timer = window.setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isPrinting]);

  const handleAcceptQuote = async () => {
    setIsAccepting(true);
    try {
      const { data, error } = await supabase.rpc('accept_estimate_and_create_job', { p_estimate_id: estimate.id });
      if (error) throw error;
      toast.success('Devis accepté. Le budget initial du chantier est figé.');
      router.push(`/dashboard/jobs/${data}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de créer le chantier');
    } finally {
      setIsAccepting(false);
    }
  };

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('fr-FR');
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const marginInput = (item: EstimateItem): Pick<EstimateItem, 'cost_price' | 'sell_price'> => {
    const hasInternalCosts = Number.isFinite(item.materials_cost) || Number.isFinite(item.labor_cost);
    return {
      cost_price: item.cost_price ?? (hasInternalCosts ? (item.materials_cost ?? 0) + (item.labor_cost ?? 0) : undefined),
      sell_price: item.sell_price ?? (hasInternalCosts ? item.amount_ht : undefined),
    };
  };

  const displayMargin = (item: EstimateItem) => calculateMargin(marginInput(item));
  const totalMargin = () => calculateTotalMargin(editedEstimate.categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item, ...marginInput(item) })),
  })));

  const handleDeleteItem = (categoryIndex: number, itemIndex: number) => {
    const newCategories = [...editedEstimate.categories];
    newCategories[categoryIndex].items.splice(itemIndex, 1);

    if (newCategories[categoryIndex].items.length === 0) {
      newCategories.splice(categoryIndex, 1);
    }

    const recalculated = recalculateEstimateTotals(newCategories);
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

    const recalculated = recalculateEstimateTotals(newCategories);
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
      toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
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
    <Card className="w-full bg-brand-darkCard border-gray-800">
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg sm:text-xl text-white">Scénario {getScenarioLabel(estimate.scenario_type)}</CardTitle>
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
              <CardDescription className="text-sm sm:text-base text-gray-400">
                <span className="font-semibold text-gray-300">Projet:</span> {projectTitle}
              </CardDescription>
            )}
            {estimate.estimate_number && (
              <CardDescription className="text-xs sm:text-sm flex flex-col sm:flex-row sm:gap-2 text-gray-400">
                <span><span className="font-semibold text-gray-300">N° Devis:</span> {estimate.estimate_number}</span>
                <span><span className="font-semibold text-gray-300">Date:</span> {formatDate(estimate.estimate_date)}</span>
                <span><span className="font-semibold text-gray-300">Validité:</span> {estimate.validity_days || 30} jours</span>
              </CardDescription>
            )}
            {estimate.model_used && (
              <CardDescription className="text-xs sm:text-sm text-gray-400">
                <span className="font-semibold text-gray-300">Généré par:</span> {estimate.model_used}
              </CardDescription>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {estimate.quote_status !== 'accepted' && canCreateJob && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptQuote}
                disabled={isAccepting || isEditing}
                className="text-xs sm:text-sm"
              >
                <BriefcaseBusiness className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                {isAccepting ? 'Création…' : 'Accepter et créer le chantier'}
              </Button>
            )}
            {estimate.quote_status !== 'accepted' && !canCreateJob && (
              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">Chantiers · offre Business</Badge>
            )}
            {estimate.quote_status === 'accepted' && (
              <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">Chantier créé</Badge>
            )}
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
              </>
            ) : (
              <>
                <Button
                  variant="primary"
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
          <div className="bg-brand-green/10 border border-brand-green/30 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-300">
              <span className="font-semibold text-brand-green">💡 Pourquoi ce scénario?</span> {estimate.scenario_justification}
            </p>
          </div>
        )}

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:grid-cols-3 bg-brand-darkLight border-gray-800">
              <TabsTrigger value="client" className="text-xs sm:text-sm data-[state=active]:bg-brand-green data-[state=active]:text-white">Client</TabsTrigger>
              <TabsTrigger value="detailed" className="text-xs sm:text-sm data-[state=active]:bg-brand-green data-[state=active]:text-white">Détaillée</TabsTrigger>
              <TabsTrigger value="internal" className="text-xs sm:text-sm data-[state=active]:bg-brand-green data-[state=active]:text-white">Interne</TabsTrigger>
            </TabsList>
            <Button type="button" variant="outline" size="sm" disabled={isEditing || isPrinting} onClick={() => setIsPrinting(true)} className="w-full sm:w-auto text-xs sm:text-sm border-gray-700 text-gray-300 hover:bg-brand-darkLight">
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
                className="w-full bg-brand-darkLight px-3 sm:px-4 py-2 sm:py-3 rounded-md hover:bg-brand-dark transition-colors border border-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-sm sm:text-lg text-white">{category.name}</h3>
                    {category.description && (
                      <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-bold text-xs sm:text-base text-brand-green whitespace-nowrap">
                      {formatCurrency(category.subtotal_ttc)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-gray-400" />
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
                        <tr className="bg-brand-darkLight border-b-2 border-gray-800">
                          <th className="text-left p-3 font-semibold text-sm text-gray-300">Poste</th>
                          {viewMode !== 'client' && (
                            <>
                              <th className="text-left p-3 font-semibold text-sm text-gray-300">Description</th>
                              <th className="text-center p-3 font-semibold text-sm text-gray-300">Qté</th>
                              <th className="text-center p-3 font-semibold text-sm text-gray-300">Unité</th>
                              <th className="text-right p-3 font-semibold text-sm text-gray-300">PU HT</th>
                              <th className="text-right p-3 font-semibold text-sm text-gray-300">Montant HT</th>
                              <th className="text-center p-3 font-semibold text-sm text-gray-300">TVA</th>
                            </>
                          )}
                          <th className="text-right p-3 font-semibold text-sm text-gray-300">Montant TTC</th>
                          {viewMode === 'internal' && (
                            <>
                              <th className="text-right p-3 font-semibold text-sm text-gray-300">Matériaux</th>
                              <th className="text-right p-3 font-semibold text-sm text-gray-300">Main-d’œuvre</th>
                              <th className="text-right p-3 font-semibold text-sm text-gray-300">Marge €</th>
                              <th className="text-right p-3 font-semibold text-sm text-gray-300">Marge %</th>
                            </>
                          )}
                          {isEditing && <th className="text-center p-3 font-semibold text-sm w-12 text-gray-300"></th>}
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
                            calculateMargin={displayMargin}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-2">
                    {category.items.map((item, itemIndex) => {
                      const margin = viewMode === 'internal' ? displayMargin(item) : null;
                      return (
                        <div
                          key={itemIndex}
                          className="bg-brand-darkLight border border-gray-800 rounded-lg p-3 space-y-2"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate text-white">{item.poste}</h4>
                              {viewMode !== 'client' && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                              )}
                            </div>
                            <span className="font-bold text-brand-green text-sm whitespace-nowrap">
                              {formatCurrency(item.amount_ttc)}
                            </span>
                          </div>

                          {viewMode !== 'client' && (
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-800">
                              <div>
                                <span className="text-gray-500">Quantité:</span>
                                <span className="ml-1 font-medium text-gray-300">{item.quantity} {item.unit}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">PU HT:</span>
                                <span className="ml-1 font-medium text-gray-300">{formatCurrency(item.unit_price_ht)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Montant HT:</span>
                                <span className="ml-1 font-medium text-gray-300">{formatCurrency(item.amount_ht)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">TVA:</span>
                                <span className="ml-1 font-medium text-gray-300">{item.tva_percent}%</span>
                              </div>
                            </div>
                          )}

                          {viewMode === 'detailed' && (item.materials_cost || item.labor_cost) && (
                            <div className="text-xs text-gray-500 pt-2 border-t border-gray-800 space-y-1">
                              {item.materials_cost && (
                                <div className="text-gray-400">Matériaux: {formatCurrency(item.materials_cost)}</div>
                              )}
                              {item.labor_cost && (
                                <div className="text-gray-400">Main-d'œuvre: {formatCurrency(item.labor_cost)}</div>
                              )}
                            </div>
                          )}

                          {viewMode === 'internal' && margin && (
                            <div className="text-xs pt-2 border-t grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-500">Matériaux:</span>
                                {isEditing ? <Input type="number" min="0" step="0.01" value={item.materials_cost ?? 0} onChange={(event) => handleItemChange(catIndex, itemIndex, 'materials_cost', Number(event.target.value) || 0)} className="mt-1 h-8 bg-brand-dark border-gray-700 text-white" /> : <span className="ml-1 text-gray-300">{formatCurrency(item.materials_cost ?? 0)}</span>}
                              </div>
                              <div>
                                <span className="text-gray-500">Main-d’œuvre:</span>
                                {isEditing ? <Input type="number" min="0" step="0.01" value={item.labor_cost ?? 0} onChange={(event) => handleItemChange(catIndex, itemIndex, 'labor_cost', Number(event.target.value) || 0)} className="mt-1 h-8 bg-brand-dark border-gray-700 text-white" /> : <span className="ml-1 text-gray-300">{formatCurrency(item.labor_cost ?? 0)}</span>}
                              </div>
                              <div>
                                <span className="text-gray-500">Marge:</span>
                                <span className="ml-1 font-semibold text-green-700">
                                  {formatCurrency(margin.margin)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Marge %:</span>
                                <span className="ml-1 font-semibold text-brand-green">
                                  {margin.marginPercent.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-brand-darkLight px-3 sm:px-4 py-2 sm:py-3 rounded font-bold border-t-2 border-gray-800">
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-white">Sous-total {category.name}</span>
                      <div className="flex flex-col items-end gap-0.5 sm:gap-1">
                        {viewMode !== 'client' && (
                          <div className="text-xs sm:text-sm text-gray-400">
                            HT: {formatCurrency(category.subtotal_ht)} + TVA: {formatCurrency(category.subtotal_tva)}
                          </div>
                        )}
                        <span className="text-brand-green">{formatCurrency(category.subtotal_ttc)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <div className="bg-brand-darkCard p-4 sm:p-6 rounded-lg border-2 border-gray-800 space-y-2 sm:space-y-3">
          <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-white">Récapitulatif</h3>
          {viewMode !== 'client' && (
            <>
              <div className="flex justify-between text-sm sm:text-lg text-gray-300">
                <span>Total HT:</span>
                <span className="font-semibold text-white">{formatCurrency(estimate.total_ht)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-lg text-gray-300">
                <span>Total TVA:</span>
                <span className="font-semibold text-white">{formatCurrency(estimate.total_tva)}</span>
              </div>
            </>
          )}
          {estimate.discount_amount && estimate.discount_amount > 0 && (
            <>
              <div className="flex justify-between text-sm sm:text-lg text-brand-green">
                <span>Remise ({estimate.discount_percent}%):</span>
                <span className="font-semibold">- {formatCurrency(estimate.discount_amount)}</span>
              </div>
              <div className="border-t border-gray-800 pt-2"></div>
            </>
          )}
          <div className="flex justify-between text-xl sm:text-2xl font-bold text-brand-green pt-2 border-t-2 border-gray-700">
            <span>Total TTC:</span>
            <span>{formatCurrency(estimate.total_ttc - (estimate.discount_amount || 0))}</span>
          </div>
          {viewMode === 'internal' && totalMargin() && (
            <div className="flex justify-between text-sm sm:text-lg text-brand-green pt-2 border-t border-gray-800">
              <span>Marge totale:</span>
              <span className="font-semibold">
                {formatCurrency(totalMargin()!.margin)} ({totalMargin()!.marginPercent.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        {(estimate.payment_terms || estimate.execution_delay || estimate.deposit_required || estimate.special_conditions) && (
          <div className="bg-brand-darkCard p-4 sm:p-6 rounded-lg border border-gray-800 space-y-2 sm:space-y-3">
            <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-white">Informations Devis</h3>
            {estimate.payment_terms && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-300">Conditions de paiement:</span>
                <p className="text-gray-400 mt-1">{estimate.payment_terms}</p>
              </div>
            )}
            {estimate.execution_delay && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-300">Délai d'exécution:</span>
                <p className="text-gray-400 mt-1">{estimate.execution_delay}</p>
              </div>
            )}
            {estimate.deposit_required && estimate.deposit_required > 0 && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-300">Acompte demandé:</span>
                <p className="text-gray-400 mt-1">{estimate.deposit_required}% à la commande</p>
              </div>
            )}
            {estimate.special_conditions && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-300">Conditions particulières:</span>
                <p className="text-gray-400 mt-1">{estimate.special_conditions}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <section className={isPrinting ? 'client-estimate-print client-estimate-print-active' : 'client-estimate-print'} aria-hidden={!isPrinting}>
        <header className="mb-8 border-b-2 border-slate-900 pb-4">
          <div className="flex items-start justify-between gap-6">
            <div><p className="text-2xl font-bold">Devisia</p><p className="text-sm text-slate-600">Devis professionnel</p></div>
            <div className="text-right text-sm">
              <p className="text-lg font-bold">{clientExport.estimateNumber || 'Devis'}</p>
              <p>{formatDate(clientExport.estimateDate)}</p>
              <p>Validité : {clientExport.validityDays || 30} jours</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
            <div><p className="font-semibold">Projet</p><p>{clientExport.projectTitle || 'Travaux'}</p></div>
            <div><p className="font-semibold">Client</p><p>{clientExport.clientName || 'À préciser'}</p></div>
          </div>
        </header>

        {clientExport.categories.map((category, categoryIndex) => (
          <div key={`${category.name}-${categoryIndex}`} className="mb-6 break-inside-avoid">
            <h2 className="mb-2 text-base font-bold">{category.name}</h2>
            {category.description && <p className="mb-2 text-xs text-slate-600">{category.description}</p>}
            <table className="w-full border-collapse text-xs">
              <thead><tr className="border-y border-slate-400 bg-slate-100"><th className="p-2 text-left">Prestation</th><th className="p-2 text-right">Qté</th><th className="p-2 text-right">PU HT</th><th className="p-2 text-right">Total HT</th><th className="p-2 text-right">TVA</th><th className="p-2 text-right">TTC</th></tr></thead>
              <tbody>{category.items.map((item, itemIndex) => <tr key={`${item.poste}-${itemIndex}`} className="border-b border-slate-200"><td className="p-2"><p className="font-medium">{item.poste}</p>{item.description && <p className="text-[10px] text-slate-600">{item.description}</p>}</td><td className="p-2 text-right">{item.quantity} {item.unit}</td><td className="p-2 text-right">{formatCurrency(item.unitPriceHt)}</td><td className="p-2 text-right">{formatCurrency(item.amountHt)}</td><td className="p-2 text-right">{item.vatPercent} %</td><td className="p-2 text-right font-medium">{formatCurrency(item.amountTtc)}</td></tr>)}</tbody>
              <tfoot><tr className="border-t border-slate-500 font-semibold"><td className="p-2" colSpan={3}>Sous-total</td><td className="p-2 text-right">{formatCurrency(category.subtotalHt)}</td><td className="p-2 text-right">{formatCurrency(category.subtotalTva)}</td><td className="p-2 text-right">{formatCurrency(category.subtotalTtc)}</td></tr></tfoot>
            </table>
          </div>
        ))}

        <div className="ml-auto w-72 space-y-1 border-t-2 border-slate-900 pt-3 text-sm">
          <div className="flex justify-between"><span>Total HT</span><strong>{formatCurrency(clientExport.totalHt)}</strong></div>
          <div className="flex justify-between"><span>Total TVA</span><strong>{formatCurrency(clientExport.totalTva)}</strong></div>
          {clientExport.discountAmount ? <div className="flex justify-between"><span>Remise</span><strong>- {formatCurrency(clientExport.discountAmount)}</strong></div> : null}
          <div className="flex justify-between border-t border-slate-400 pt-2 text-lg"><span>Total TTC</span><strong>{formatCurrency(clientExport.totalTtc - (clientExport.discountAmount || 0))}</strong></div>
        </div>

        {(clientExport.paymentTerms || clientExport.executionDelay || clientExport.depositRequired || clientExport.specialConditions) && <footer className="mt-8 border-t border-slate-300 pt-4 text-xs text-slate-700">
          {clientExport.paymentTerms && <p><strong>Paiement :</strong> {clientExport.paymentTerms}</p>}
          {clientExport.executionDelay && <p><strong>Délai :</strong> {clientExport.executionDelay}</p>}
          {clientExport.depositRequired ? <p><strong>Acompte :</strong> {clientExport.depositRequired} % à la commande</p> : null}
          {clientExport.specialConditions && <p><strong>Conditions particulières :</strong> {clientExport.specialConditions}</p>}
        </footer>}
      </section>

    </Card>
  );
}
