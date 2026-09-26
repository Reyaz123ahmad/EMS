import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  Search, 
  DownloadCloud,
  FileText,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export function PaymentsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['payments-history', page, statusFilter],
    queryFn: async () => {
      const res = await api.get('/payments/history', {
        params: { page, limit: 15 }
      });
      return res.data?.data || res.data || { payments: [], total: 0, totalPages: 1 };
    }
  });

  const rawPayments = data?.payments || [];
  const totalCount = data?.total || rawPayments.length;
  const totalPages = data?.totalPages || Math.ceil(totalCount / 15) || 1;

  // Filter client side by search keyword if present
  const payments = rawPayments.filter(p => {
    if (!search) return true;
    const term = search.toLowerCase();
    const orderId = (p.razorpayOrderId || p.id || '').toLowerCase();
    const paymentId = (p.razorpayPaymentId || '').toLowerCase();
    const compName = (p.subscription?.company?.name || '').toLowerCase();
    const planName = (p.subscription?.plan?.name || '').toLowerCase();
    return orderId.includes(term) || paymentId.includes(term) || compName.includes(term) || planName.includes(term);
  }).filter(p => {
    if (!statusFilter) return true;
    return p.status === statusFilter;
  });

  // Calculate statistics
  const totalRevenue = rawPayments
    .filter(p => p.status === 'SUCCESS')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const successfulPayments = rawPayments.filter(p => p.status === 'SUCCESS').length;
  const failedPayments = rawPayments.filter(p => p.status === 'FAILED').length;

  const handleDownload = async (paymentId) => {
    try {
      toast.info('Downloading payment receipt...');
      const response = await api.get(`/payments/${paymentId}/receipt`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const columns = [
    {
      header: 'Transaction / Order',
      key: 'id',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-mono text-xs font-semibold text-slate-100 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-400" />
            {row.razorpayOrderId || (row.companyCode ? `${row.companyCode}-PAY` : row.id.slice(0, 16))}
          </div>
          {row.razorpayPaymentId && (
            <div className="font-mono text-[11px] text-slate-400">
              Pay ID: {row.razorpayPaymentId}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Company / Organization',
      key: 'company',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-200">
            {row.subscription?.company?.name || 'Platform Tenant'}
          </div>
          <div className="text-slate-400 text-[11px]">
            Code: <span className="text-slate-300 font-mono">{row.subscription?.company?.companyCode || 'COMP-ORG'}</span> | Plan: <span className="text-indigo-400 font-semibold">{row.subscription?.plan?.name || 'Pro Plan'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (row) => (
        <div className="font-semibold text-sm text-slate-100 font-mono">
          Rs. {Number(row.amount || 0).toLocaleString('en-IN')}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => {
        if (row.status === 'SUCCESS') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> Success
            </span>
          );
        }
        if (row.status === 'FAILED') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <XCircle className="w-3 h-3" /> Failed
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> {row.status || 'Pending'}
          </span>
        );
      }
    },
    {
      header: 'Date & Time',
      key: 'date',
      render: (row) => (
        <div className="text-xs text-slate-400">
          {new Date(row.createdAt).toLocaleDateString()} {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            variant="ghost"
            onClick={() => setSelectedPayment(row)}
            className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(row.id)}
            className="text-xs border-slate-700 hover:bg-slate-800"
          >
            <DownloadCloud className="w-3.5 h-3.5 mr-1" /> Receipt
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            {isSuperAdmin ? 'Platform Payments & Transactions' : 'Billing & Payments'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isSuperAdmin 
              ? 'Real-time ledger of all subscription transactions across tenant organizations.'
              : 'Review your transaction records, order IDs, and payment statuses.'}
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-slate-900/60 border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Processed Volume</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white font-mono">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Gross successful payments on platform</div>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Successful Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400 font-mono">
            {successfulPayments}
          </div>
          <div className="mt-1 text-xs text-slate-500">Captured and settled automatically</div>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Failed / Issues</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-400 font-mono">
            {failedPayments}
          </div>
          <div className="mt-1 text-xs text-slate-500">Declined cards or webhook cancellations</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by order ID, payment ID, company or plan..."
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
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Data Table */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md overflow-hidden">
        <DataTable
          columns={columns}
          data={payments}
          isLoading={isLoading}
          pagination={{
            page,
            totalPages,
            total: totalCount,
            onPageChange: setPage
          }}
          emptyMessage="No payment transactions found matching the criteria."
        />
      </Card>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <Modal
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          title="Payment Transaction Details"
        >
          <div className="space-y-4 text-slate-300 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 font-mono">
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-slate-200">{selectedPayment.id}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500">Razorpay Order ID:</span>
                <span className="text-blue-400">{selectedPayment.razorpayOrderId || '—'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500">Razorpay Payment ID:</span>
                <span className="text-emerald-400">{selectedPayment.razorpayPaymentId || '—'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500">Amount:</span>
                <span className="text-white font-bold text-sm">${Number(selectedPayment.amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500">Status:</span>
                <span className="text-slate-200 font-bold">{selectedPayment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-400">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayment(null)}
                className="border-slate-700"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PaymentsPage;
