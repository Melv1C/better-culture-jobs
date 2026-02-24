import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@melv1c/ui-core';
import { UserRole } from '@repo/utils';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { PAGE_SIZES, ROLES } from '../constants';
import { useUsersStore } from '../users-store';

export function UsersFilter() {
  const filter = useUsersStore(state => state.filter);
  const setFilter = useUsersStore(state => state.setFilter);
  const resetFilters = useUsersStore(state => state.resetFilters);
  const openCreateDialog = useUsersStore(state => state.openCreateDialog);

  const [searchInput, setSearchInput] = useState(filter.searchValue);

  const handleSearch = () => {
    setFilter({ searchValue: searchInput.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearchFieldChange = (value: 'email' | 'name') => {
    setFilter({ searchField: value });
  };

  const handleRoleChange = (value: 'all' | UserRole) => {
    setFilter({ role: value === 'all' ? null : value });
  };

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      setFilter({ banned: null });
    } else if (value === 'active') {
      setFilter({ banned: false });
    } else {
      setFilter({ banned: true });
    }
  };

  const handlePageSizeChange = (value: string) => {
    setFilter({ limit: parseInt(value, 10), offset: 0 });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split('-') as [
      'name' | 'email' | 'createdAt',
      'asc' | 'desc',
    ];
    setFilter({ sortBy, sortDirection });
  };

  const handleReset = () => {
    setSearchInput('');
    resetFilters();
  };

  const currentStatus = filter.banned === null ? 'all' : filter.banned ? 'banned' : 'active';
  const currentSort = `${filter.sortBy}-${filter.sortDirection}`;

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Top row: Search and Create button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Select value={filter.searchField} onValueChange={handleSearchFieldChange}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search by ${filter.searchField}...`}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Search
              </Button>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Create User
            </Button>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={filter.role ?? 'all'} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLES.map(role => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={currentStatus} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sort by</Label>
              <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest first</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest first</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="email-asc">Email A-Z</SelectItem>
                  <SelectItem value="email-desc">Email Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Per page</Label>
              <Select value={filter.limit.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
