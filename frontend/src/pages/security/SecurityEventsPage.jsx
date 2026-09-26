import React, { useState } from 'react';
import { useSecurityEvents } from '../../hooks/useAdvancedSecurity.js';
import SecurityEventCard from '../../components/security/SecurityEventCard.jsx';
import { Activity, Search, Shield } from 'lucide-react';

export function SecurityEventsPage() {
  const [search, setSearch] = useState('');
  const { data: eventsData, isLoading } = useSecurityEvents();
  const events = Array.isArray(eventsData)
    ? eventsData
    : Array.isArray(eventsData?.events)
    ? eventsData.events
    : Array.isArray(eventsData?.data)
    ? eventsData.data
    : [];

  const filteredEvents = Array.isArray(events)
    ? events.filter((e) =>
        search ? (e?.description || e?.eventType || '').toLowerCase().includes(search.toLowerCase()) : true
      )
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Security Events & Stream
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time chronological feed of security authentications, IP blocks, and token events.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <Activity className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Events Recorded</h3>
          <p className="text-xs text-slate-400">Security event streams will appear here as users authenticate.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt, idx) => (
            <SecurityEventCard key={evt.id || idx} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SecurityEventsPage;
