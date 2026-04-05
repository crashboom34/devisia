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
    <div className="space-y-2.5 sm:space-y-0 sm:flex sm:flex-row sm:gap-3 mb-4 lg:mb-6 p-3 lg:p-4 bg-white rounded-xl border border-gray-200">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10 h-10 lg:h-11 bg-gray-50 border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-lg"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {onStatusChange && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="min-w-[140px] sm:min-w-[160px] h-10 lg:h-11 bg-gray-50 border-gray-200 text-gray-700 text-sm hover:bg-gray-100 transition-colors">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all" className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50">
                Tous
              </SelectItem>
              <SelectItem value="draft" className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50">
                Brouillon
              </SelectItem>
              <SelectItem value="sent" className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50">
                Envoye
              </SelectItem>
              <SelectItem value="approved" className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50">
                Approuve
              </SelectItem>
              <SelectItem value="rejected" className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50">
                Rejete
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="h-10 w-10 lg:h-11 lg:w-11 text-gray-400 hover:text-gray-900"
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
