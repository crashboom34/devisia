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
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
        />
      </div>

      <div className="flex gap-2">
        {onStatusChange && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white hover:bg-slate-700">
                Tous les statuts
              </SelectItem>
              <SelectItem value="draft" className="text-white hover:bg-slate-700">
                Brouillon
              </SelectItem>
              <SelectItem value="sent" className="text-white hover:bg-slate-700">
                Envoyé
              </SelectItem>
              <SelectItem value="approved" className="text-white hover:bg-slate-700">
                Approuvé
              </SelectItem>
              <SelectItem value="rejected" className="text-white hover:bg-slate-700">
                Rejeté
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            className="border-slate-700 hover:bg-slate-800 text-slate-400"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}

        {additionalActions}
      </div>
    </div>
  );
}
