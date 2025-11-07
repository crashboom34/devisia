'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

interface EditableEstimateRowProps {
  item: EstimateItem;
  itemIndex: number;
  categoryIndex: number;
  isEditing: boolean;
  viewMode: 'client' | 'detailed' | 'internal';
  onItemChange: (categoryIndex: number, itemIndex: number, field: keyof EstimateItem, value: any) => void;
  onDelete: (categoryIndex: number, itemIndex: number) => void;
  formatCurrency: (amount: number) => string;
  calculateMargin: (item: EstimateItem) => { margin: number; marginPercent: number } | null;
}

export default function EditableEstimateRow({
  item,
  itemIndex,
  categoryIndex,
  isEditing,
  viewMode,
  onItemChange,
  onDelete,
  formatCurrency,
  calculateMargin,
}: EditableEstimateRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const margin = viewMode === 'internal' ? calculateMargin(item) : null;

  const handleChange = (field: keyof EstimateItem, value: string) => {
    const numericValue = ['quantity', 'unit_price_ht', 'tva_percent'].includes(field)
      ? parseFloat(value) || 0
      : value;
    onItemChange(categoryIndex, itemIndex, field, numericValue);
  };

  return (
    <tr
      className={`border-b ${itemIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
    >
      <td className="p-3 font-medium text-sm">
        {isEditing ? (
          <Input
            value={item.poste}
            onChange={(e) => handleChange('poste', e.target.value)}
            className="h-8 text-sm"
          />
        ) : (
          item.poste
        )}
      </td>
      {viewMode !== 'client' && (
        <>
          <td className="p-3 text-sm max-w-xs">
            {isEditing ? (
              <Input
                value={item.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="h-8 text-sm"
              />
            ) : (
              <>
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
              </>
            )}
          </td>
          <td className="p-3 text-center text-sm">
            {isEditing ? (
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className="h-8 text-sm w-20"
                min="0"
                step="0.01"
              />
            ) : (
              item.quantity
            )}
          </td>
          <td className="p-3 text-center text-xs">
            {isEditing ? (
              <Input
                value={item.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="h-8 text-xs w-20"
              />
            ) : (
              item.unit
            )}
          </td>
          <td className="p-3 text-right text-sm">
            {isEditing ? (
              <Input
                type="number"
                value={item.unit_price_ht}
                onChange={(e) => handleChange('unit_price_ht', e.target.value)}
                className="h-8 text-sm w-28"
                min="0"
                step="0.01"
              />
            ) : (
              formatCurrency(item.unit_price_ht)
            )}
          </td>
          <td className="p-3 text-right font-semibold text-sm">{formatCurrency(item.amount_ht)}</td>
          <td className="p-3 text-center text-xs">
            {isEditing ? (
              <Input
                type="number"
                value={item.tva_percent}
                onChange={(e) => handleChange('tva_percent', e.target.value)}
                className="h-8 text-xs w-16"
                min="0"
                max="100"
                step="0.1"
              />
            ) : (
              `${item.tva_percent}%`
            )}
          </td>
        </>
      )}
      <td className="p-3 text-right font-bold text-blue-700 text-sm">
        {formatCurrency(item.amount_ttc)}
      </td>
      {viewMode === 'internal' && margin && (
        <>
          <td className="p-3 text-right text-green-700 font-semibold text-sm">
            {formatCurrency(margin.margin)}
          </td>
          <td className="p-3 text-right text-green-700 font-semibold text-sm">
            {margin.marginPercent.toFixed(1)}%
          </td>
        </>
      )}
      {isEditing && (
        <td className="p-3 text-center">
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette ligne? Cette action est irréversible et
                  les totaux seront recalculés automatiquement.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDelete(categoryIndex, itemIndex);
                    setShowDeleteDialog(false);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </td>
      )}
    </tr>
  );
}
