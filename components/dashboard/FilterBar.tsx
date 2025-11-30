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
    <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-11 h-11 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-lg"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {onStatusChange && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="min-w-[180px] h-11 bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-800 transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all" className="text-white hover:bg-slate-800 focus:bg-slate-800">
                Tous les statuts
              </SelectItem>
              <SelectItem value="draft" className="text-white hover:bg-slate-800 focus:bg-slate-800">
                Brouillon
              </SelectItem>
              <SelectItem value="sent" className="text-white hover:bg-slate-800 focus:bg-slate-800">
                Envoyé
              </SelectItem>
              <SelectItem value="approved" className="text-white hover:bg-slate-800 focus:bg-slate-800">
                Approuvé
              </SelectItem>
              <SelectItem value="rejected" className="text-white hover:bg-slate-800 focus:bg-slate-800">
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
            className="h-11 w-11 border-slate-700/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}

        {additionalActions}
      </div>
    </div>
  );
}
