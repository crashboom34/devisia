'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { EstimateItem } from '@/lib/pricing/engine';
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
      className={`border-b border-gray-800 ${itemIndex % 2 === 0 ? 'bg-brand-darkCard' : 'bg-brand-darkLight'} hover:bg-brand-dark transition-colors`}
    >
      <td className="p-3 font-medium text-sm text-white">
        {isEditing ? (
          <Input
            value={item.poste}
            onChange={(e) => handleChange('poste', e.target.value)}
            className="h-8 text-sm bg-brand-darkLight border-gray-700 text-white"
          />
        ) : (
          item.poste
        )}
      </td>
      {viewMode !== 'client' && (
        <>
          <td className="p-3 text-sm max-w-xs text-gray-300">
            {isEditing ? (
              <Input
                value={item.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="h-8 text-sm bg-brand-darkLight border-gray-700 text-white"
              />
            ) : (
              <>
                {item.description}
                {viewMode === 'detailed' && (item.materials_cost || item.labor_cost) && (
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    {item.materials_cost && (
                      <div className="text-gray-400">Matériaux: {formatCurrency(item.materials_cost)}</div>
                    )}
                    {item.labor_cost && (
                      <div className="text-gray-400">Main-d'œuvre: {formatCurrency(item.labor_cost)}</div>
                    )}
                  </div>
                )}
              </>
            )}
          </td>
          <td className="p-3 text-center text-sm text-gray-300">
            {isEditing ? (
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className="h-8 text-sm w-20 bg-brand-darkLight border-gray-700 text-white"
                min="0"
                step="0.01"
              />
            ) : (
              item.quantity
            )}
          </td>
          <td className="p-3 text-center text-xs text-gray-300">
            {isEditing ? (
              <Input
                value={item.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="h-8 text-xs w-20 bg-brand-darkLight border-gray-700 text-white"
              />
            ) : (
              item.unit
            )}
          </td>
          <td className="p-3 text-right text-sm text-gray-300">
            {isEditing ? (
              <Input
                type="number"
                value={item.unit_price_ht}
                onChange={(e) => handleChange('unit_price_ht', e.target.value)}
                className="h-8 text-sm w-28 bg-brand-darkLight border-gray-700 text-white"
                min="0"
                step="0.01"
              />
            ) : (
              formatCurrency(item.unit_price_ht)
            )}
          </td>
          <td className="p-3 text-right font-semibold text-sm text-white">{formatCurrency(item.amount_ht)}</td>
          <td className="p-3 text-center text-xs text-gray-300">
            {isEditing ? (
              <Input
                type="number"
                value={item.tva_percent}
                onChange={(e) => handleChange('tva_percent', e.target.value)}
                className="h-8 text-xs w-16 bg-brand-darkLight border-gray-700 text-white"
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
      <td className="p-3 text-right font-bold text-brand-green text-sm">
        {formatCurrency(item.amount_ttc)}
      </td>
      {viewMode === 'internal' && margin && (
        <>
          <td className="p-3 text-right text-brand-green font-semibold text-sm">
            {formatCurrency(margin.margin)}
          </td>
          <td className="p-3 text-right text-brand-green font-semibold text-sm">
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
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-brand-darkCard border-gray-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
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
