import { useId } from 'react';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  onRefresh?: () => void;
  additionalActions?: React.ReactNode;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  statusFilter,
  onStatusChange,
  onRefresh,
  additionalActions,
}: FilterBarProps) {
  const searchId = useId();

  return (
    <div className="mb-4 space-y-2.5 rounded-xl border border-border bg-surface p-3 shadow-panel sm:flex sm:flex-row sm:gap-3 sm:space-y-0 lg:mb-6 lg:p-4">
      <div className="relative flex-1">
        <label htmlFor={searchId} className="sr-only">Rechercher</label>
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={searchId}
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="h-11 rounded-lg bg-surface-elevated pl-10 text-sm"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {onStatusChange && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger aria-label="Filtrer par statut" className="h-11 min-w-[140px] bg-surface-elevated text-sm sm:min-w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Tous
              </SelectItem>
              <SelectItem value="draft">
                Brouillon
              </SelectItem>
              <SelectItem value="sent">
                Envoyé
              </SelectItem>
              <SelectItem value="approved">
                Approuvé
              </SelectItem>
              <SelectItem value="rejected">
                Rejeté
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            aria-label="Actualiser la liste"
            className="h-11 w-11 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}

        {additionalActions && (
          <div className="hidden sm:flex">{additionalActions}</div>
        )}
      </div>
    </div>
  );
}
