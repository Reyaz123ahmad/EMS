import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function HolidayForm({ initialData, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
    description: initialData?.description || '',
    isOptional: initialData?.isOptional || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Holiday Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g. New Year's Day, Independence Day, Diwali"
      />

      <Input
        label="Holiday Date"
        type="date"
        required
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
        <textarea
          rows="2"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Festival notes or company celebration guidelines..."
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isOptional}
            onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
          />
          Optional / Restricted Holiday (Employee Choice)
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {initialData ? 'Update Holiday' : 'Add Holiday'}
        </Button>
      </div>
    </form>
  );
}
