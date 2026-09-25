import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Ban,
  Eye,
  CheckCircle2,
  XCircle,
  QrCode
} from 'lucide-react';
import { useCards, useDeactivateCard, useRegenerateQR } from '../../hooks/useBiometricCards';
import dayjs from 'dayjs';

export default function CardListPage() {
  const [search, setSearch] = useState('');
  const [cardType, setCardType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useCards({
    search: search || undefined,
    cardType: cardType || undefined,
    isActive: statusFilter === '' ? undefined : statusFilter === 'active',
    page,
    limit: 10
  });

  const deactivateMutation = useDeactivateCard();
  const regenerateMutation = useRegenerateQR();

  const handleDeactivate = (cardId, cardNumber) => {
    const reason = window.prompt(`Enter reason to deactivate card ${cardNumber}:`, 'Lost or damaged card');
    if (reason) {
      deactivateMutation.mutate({ cardId, reason });
    }
  };

  const handleRegenerate = (cardId) => {
    if (window.confirm('Regenerate QR signature and create a new PDF badge for this employee?')) {
      regenerateMutation.mutate(cardId);
    }
  };

  const cards = data?.data?.cards || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            Employee Identity & Biometric Cards
          </h1>
          <p className="text-sm text-slate-400">
            Manage tamper-proof QR identity badges, RFID, and NFC cards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/biometric/cards/generate"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Generate QR Card
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name, code, or card number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl pl-10 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={cardType}
            onChange={(e) => setCardType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Card Types</option>
            <option value="QR">QR Code Badge</option>
            <option value="RFID">RFID Card</option>
            <option value="NFC">NFC Card</option>
            <option value="MAGNETIC">Magnetic Strip</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Cards</option>
            <option value="inactive">Deactivated Cards</option>
          </select>
        </div>
      </div>

      {/* Cards Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Card Number</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Issued / Expires</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    Loading biometric cards...
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No cards found matching the criteria.
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-400" />
                      {card.cardNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-200">
                          {card.employee?.firstName} {card.employee?.lastName}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {card.employee?.employeeCode} • {card.employee?.department?.name || 'General'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                        {card.cardType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {card.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <p>Issued: {dayjs(card.assignedAt).format('DD MMM YYYY')}</p>
                      <p className="text-slate-500">
                        Expires: {card.expiresAt ? dayjs(card.expiresAt).format('DD MMM YYYY') : 'Never'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/biometric/cards/${card.id}`}
                        className="inline-flex items-center p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                        title="View Card Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {card.pdfUrl && (
                        <a
                          href={card.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                          title="Download PDF Badge"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}

                      {card.isActive && (
                        <>
                          <button
                            onClick={() => handleRegenerate(card.id)}
                            className="inline-flex items-center p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                            title="Regenerate QR Signature"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(card.id, card.cardNumber)}
                            className="inline-flex items-center p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Deactivate Card"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Showing {cards.length} of {total} cards
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
