import {
  Button,
  Card,
  CardContent,
  Checkbox,
  DateTimePicker,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@melv1c/ui-core';
import type { LogLevel, LogType } from '@repo/utils';
import { ChevronDown, Search, X } from 'lucide-react';
import { useLogsStore } from '../logs-store';
import { LOG_LEVELS, LOG_TYPES, PAGE_SIZES } from '../utils';

interface MultiSelectProps<T extends string> {
  options: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  placeholder: string;
  formatLabel?: (value: T) => string;
}

function MultiSelect<T extends string>({
  options,
  selected,
  onChange,
  placeholder,
  formatLabel = v => v,
}: MultiSelectProps<T>) {
  const handleToggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal" role="combobox">
          <span className="truncate">
            {selected.length === 0
              ? placeholder
              : selected.length === 1
                ? formatLabel(selected[0]!)
                : `${selected.length} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-2">
          {options.map(option => (
            <div key={option} className="flex items-center gap-2">
              <Checkbox
                id={`option-${option}`}
                checked={selected.includes(option)}
                onCheckedChange={() => handleToggle(option)}
              />
              <Label
                htmlFor={`option-${option}`}
                className="cursor-pointer text-sm font-normal capitalize"
              >
                {formatLabel(option)}
              </Label>
            </div>
          ))}
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => onChange([])}>
              Clear all
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function LogsFilter() {
  const filter = useLogsStore(state => state.filter);
  const searchInput = useLogsStore(state => state.searchInput);
  const setSearchInput = useLogsStore(state => state.setSearchInput);
  const updateFilter = useLogsStore(state => state.updateFilter);
  const clearFilters = useLogsStore(state => state.clearFilters);

  const handleSearch = () => {
    updateFilter({ search: searchInput.trim() || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasActiveFilters = Boolean(
    (filter.types && filter.types.length > 0) ||
    (filter.levels && filter.levels.length > 0) ||
    filter.search ||
    filter.startDate ||
    filter.endDate,
  );

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Search - Full width on its own row */}
        <div>
          <label htmlFor="search-input" className="mb-1.5 block text-sm font-medium">
            Search
          </label>
          <div className="flex gap-2">
            <Input
              id="search-input"
              placeholder="Search by message, path, or user ID..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button variant="secondary" size="icon" onClick={handleSearch} title="Search">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Type Filter */}
          <div className="w-40">
            <label className="mb-1.5 block text-sm font-medium">Type</label>
            <MultiSelect<LogType>
              options={LOG_TYPES}
              selected={filter.types ?? []}
              onChange={types => updateFilter({ types: types.length > 0 ? types : undefined })}
              placeholder="All types"
            />
          </div>

          {/* Level Filter */}
          <div className="w-40">
            <label className="mb-1.5 block text-sm font-medium">Level</label>
            <MultiSelect<LogLevel>
              options={LOG_LEVELS}
              selected={filter.levels ?? []}
              onChange={levels => updateFilter({ levels: levels.length > 0 ? levels : undefined })}
              placeholder="All levels"
              formatLabel={v => v.charAt(0).toUpperCase() + v.slice(1)}
            />
          </div>

          {/* Start Date */}
          <div className="w-55">
            <label className="mb-1.5 block text-sm font-medium">From</label>
            <DateTimePicker
              value={filter.startDate}
              onChange={date => updateFilter({ startDate: date })}
              placeholder="Start date"
            />
          </div>

          {/* End Date */}
          <div className="w-55">
            <label className="mb-1.5 block text-sm font-medium">To</label>
            <DateTimePicker
              value={filter.endDate}
              onChange={date => updateFilter({ endDate: date })}
              placeholder="End date"
            />
          </div>

          {/* Page Size */}
          <div className="w-25">
            <label htmlFor="page-size" className="mb-1.5 block text-sm font-medium">
              Per page
            </label>
            <Select
              value={filter.pageSize?.toString() ?? '50'}
              onValueChange={v => updateFilter({ pageSize: Number.parseInt(v, 10) })}
            >
              <SelectTrigger id="page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              title="Clear all filters"
              className="self-end"
            >
              <X className="mr-1.5 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
