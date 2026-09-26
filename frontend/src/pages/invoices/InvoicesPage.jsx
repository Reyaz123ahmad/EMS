import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { 
  Receipt, 
  DownloadCloud, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  FileText,
  Building2,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

export function InvoicesPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['platform-invoices', page],
    queryFn: async () => {
      const res = await api.get('/invoices', {
        params: { page, limit: 15 }
      });
      return res.data?.data || res.data || [];
    }
  });

  const rawInvoices = Array.isArray(data) ? data : (data?.invoices || []);

  const invoices = rawInvoices.filter(inv => {
    if (!search) return true;
    const term = search.toLowerCase();
    const invNum = (inv.invoiceNumber || inv.id || '').toLowerCase();
    const compName = (inv.company?.name || inv.subscription?.company?.name || '').toLowerCase();
    return invNum.includes(term) || compName.includes(term);
  }).filter(inv => {
    if (!statusFilter) return true;
    return inv.status === statusFilter;
  });

  const handleDownload = async (invoice) => {
    try {
      toast.info(`Generating invoice PDF for #${invoice.invoiceNumber || invoice.id.slice(0, 8)}...`);
      const res = await api.get(`/invoices/${invoice.id}/download`);
      toast.success('Invoice generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download invoice PDF.');
    }
  };

  const handleSendEmail = async (invoice) => {
    try {
      const recipient = invoice.company?.email || invoice.subscription?.company?.email || user?.email;
      await api.post(`/invoices/${invoice.id}/send-email`, { email: recipient });
      toast.success(`Invoice dispatched to ${recipient}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch invoice email.');
    }
  };

  const columns = [
    {
      header: 'Invoice #',
      key: 'invoiceNumber',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-white">
              {row.invoiceNumber || `INV-${row.id.slice(0, 8).toUpperCase()}`}
            </div>
            <div className="text-[11px] text-slate-400">
              Tax ID: GSTIN990218
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Organization',
      key: 'company',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-200">
            {row.company?.name || row.subscription?.company?.name || 'Platform Tenant'}
          </div>
          <div className="text-slate-400 text-[11px]">
            {row.company?.email || row.subscription?.company?.email || 'billing@org.com'}
          </div>
        </div>
      )
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (row) => (
        <div className="font-mono font-bold text-sm text-slate-100">
          ${Number(row.amount || row.total || 0).toFixed(2)}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => {
        const isPaid = (row.status || 'PAID') === 'PAID';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isPaid 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}>
            {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {row.status || 'PAID'}
          </span>
        );
      }
    },
    {
      header: 'Date Issued',
      key: 'createdAt',
      render: (row) => (
        <div className="text-xs text-slate-400">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(row)}
            className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200"
          >
            <DownloadCloud className="w-3.5 h-3.5 mr-1" /> PDF
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSendEmail(row)}
            className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            <Mail className="w-3.5 h-3.5 mr-1" /> Send
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="w-8 h-8 text-indigo-400" />
            Tax Invoices & Statements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Platform-wide repository of GST tax invoices, generated receipts, and billing statements.'
              : 'View and download official invoices for your subscription tier.'}
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by invoice number, company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/50 border-slate-800"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="VOID">Void</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md overflow-hidden">
        <DataTable
          columns={columns}
          data={invoices}
          isLoading={isLoading}
          emptyMessage="No invoices generated yet."
        />
      </Card>
    </div>
  );
}

export default InvoicesPage;
