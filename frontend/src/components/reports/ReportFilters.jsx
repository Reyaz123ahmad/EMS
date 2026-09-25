import React from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

export function ReportFilters({
  filters,
  onChange,
  onGenerate,
  isLoading,
  departments = [],
  branches = []
}) {
  const handleInputChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  return (
    <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Filter Parameters</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date</label>
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="bg-slate-950/60 border-slate-800 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">End Date</label>
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="bg-slate-950/60 border-slate-800 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
          <select
            value={filters.departmentId || ''}
            onChange={(e) => handleInputChange('departmentId', e.target.value)}
            className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Branch / Location</label>
          <select
            value={filters.branchId || ''}
            onChange={(e) => handleInputChange('branchId', e.target.value)}
            className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onGenerate}
          isLoading={isLoading}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Run Report Query
        </Button>
      </div>
    </Card>
  );
}

export default ReportFilters;
