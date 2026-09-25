import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatters';

export default function HolidayCard({ holiday, onEdit, onDelete }) {
  if (!holiday) return null;

  return (
    <Card className="p-5 bg-slate-900 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <Badge variant={holiday.isOptional ? 'warning' : 'primary'}>
            {holiday.isOptional ? 'Floating Holiday' : 'Mandatory Holiday'}
          </Badge>
          <span className="text-xs text-slate-400 font-semibold">{formatDate(holiday.date)}</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{holiday.name}</h3>
        {holiday.description && <p className="text-xs text-slate-400 mb-4">{holiday.description}</p>}
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-800">
        {onEdit && (
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onEdit(holiday)}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="danger" size="sm" onClick={() => onDelete(holiday.id)}>
            Delete
          </Button>
        )}
      </div>
    </Card>
  );
}
