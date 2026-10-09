import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Star,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  BarChart3,
  RefreshCw,
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import performanceService from '../../services/performance.service.js';
import useAuthStore from '../../store/auth.store.js';

export default function PerformancePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'cycles'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Forms
  const [cycleForm, setCycleForm] = useState({
    name: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(90, 'day').format('YYYY-MM-DD'),
    status: 'ACTIVE'
  });

  const [reviewForm, setReviewForm] = useState({
    cycleId: '',
    employeeId: '',
    rating: 4.5,
    comments: '',
    status: 'COMPLETED'
  });

  // Queries
  const cyclesQuery = useQuery({
    queryKey: ['performance-cycles'],
    queryFn: () => performanceService.getCycles()
  });

  const reviewsQuery = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => performanceService.getReviews()
  });

  const cycles = Array.isArray(cyclesQuery.data) ? cyclesQuery.data : (cyclesQuery.data?.cycles || []);
  const reviews = Array.isArray(reviewsQuery.data) ? reviewsQuery.data : (reviewsQuery.data?.reviews || []);

  // Mutations
  const createCycleMutation = useMutation({
    mutationFn: (data) => performanceService.createCycle(data),
    onSuccess: () => {
      toast.success('Performance cycle created successfully');
      queryClient.invalidateQueries({ queryKey: ['performance-cycles'] });
      setIsCycleModalOpen(false);
      setCycleForm({
        name: '',
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(90, 'day').format('YYYY-MM-DD'),
        status: 'ACTIVE'
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create cycle');
    }
  });

  const createReviewMutation = useMutation({
    mutationFn: (data) => performanceService.createReview(data),
    onSuccess: () => {
      toast.success('Performance review recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
      setIsReviewModalOpen(false);
      setReviewForm({
        cycleId: '',
        employeeId: '',
        rating: 4.5,
        comments: '',
        status: 'COMPLETED'
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to record review');
    }
  });

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const term = search.toLowerCase();
      const empName = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
      const empCode = (r.employee?.employeeCode || '').toLowerCase();
      const cycleName = (r.cycle?.name || '').toLowerCase();
      const matchesSearch = !search || empName.includes(term) || empCode.includes(term) || cycleName.includes(term);
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reviews, search, statusFilter]);

  // Derived KPI Stats
  const totalReviews = reviews.length;
  const activeCycles = cycles.filter((c) => c.status === 'ACTIVE').length;
  const validRatings = reviews.filter((r) => r.rating !== null && r.rating !== undefined).map((r) => Number(r.rating));
  const avgRating = validRatings.length > 0 ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1) : '0.0';
  const topPerformers = reviews.filter((r) => Number(r.rating) >= 4.5).length;

  const renderRatingStars = (rating) => {
    const num = Number(rating) || 0;
    return (
      <div className="flex items-center gap-1">
        <div className="flex text-amber-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3.5 w-3.5 ${star <= Math.round(num) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
            />
          ))}
        </div>
        <span className="ml-1 text-xs font-bold text-slate-200">{num.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen space-y-6 p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Award className="h-4 w-4" />
            <span>Talent & Performance Hub</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Performance & Reviews
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Appraisal cycles, employee competency evaluations, KPI ratings, and developmental insights
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCycleModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
            New Cycle
          </button>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Submit Review
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Cycles</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{activeCycles}</div>
            <p className="mt-1 text-[11px] text-slate-400">Current appraisal periods</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Reviews</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{totalReviews}</div>
            <p className="mt-1 text-[11px] text-emerald-400">Evaluations on record</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Rating</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{avgRating} <span className="text-sm font-normal text-slate-400">/ 5.0</span></div>
            <p className="mt-1 text-[11px] text-slate-400">Company-wide score</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Performers</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{topPerformers}</div>
            <p className="mt-1 text-[11px] text-purple-400">Rating 4.5 or higher</p>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`rounded-lg px-4 py-1.5 font-bold transition-all ${
              activeTab === 'reviews' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Employee Reviews ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cycles')}
            className={`rounded-lg px-4 py-1.5 font-bold transition-all ${
              activeTab === 'cycles' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Review Cycles ({cycles.length})
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {activeTab === 'reviews' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              cyclesQuery.refetch();
              reviewsQuery.refetch();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reviewsQuery.isLoading || cyclesQuery.isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl">
        {activeTab === 'reviews' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Evaluation Cycle</th>
                  <th className="px-5 py-3.5">Rating Score</th>
                  <th className="px-5 py-3.5">Feedback & Remarks</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reviewsQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                        <span>Loading employee performance reviews...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No performance evaluations recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-300">
                            {rev.employee?.firstName?.[0] || 'E'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {rev.employee ? `${rev.employee.firstName} ${rev.employee.lastName}` : 'Unknown Employee'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {rev.employee?.department?.name || 'Department'} • {rev.employee?.employeeCode || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-200">
                        {rev.cycle?.name || 'Annual Review'}
                      </td>
                      <td className="px-5 py-4">
                        {renderRatingStars(rev.rating)}
                      </td>
                      <td className="px-5 py-4 max-w-xs text-slate-300 truncate">
                        {rev.comments || 'No remarks provided'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                            rev.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {rev.status === 'COMPLETED' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {rev.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {rev.submittedAt ? dayjs(rev.submittedAt).format('YYYY-MM-DD') : dayjs(rev.createdAt).format('YYYY-MM-DD')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Cycle Name</th>
                  <th className="px-5 py-3.5">Start Date</th>
                  <th className="px-5 py-3.5">End Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reviews Count</th>
                  <th className="px-5 py-3.5">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cyclesQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                        <span>Loading evaluation cycles...</span>
                      </div>
                    </td>
                  </tr>
                ) : cycles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No appraisal cycles found. Create a new cycle to begin evaluations.
                    </td>
                  </tr>
                ) : (
                  cycles.map((cyc) => (
                    <tr key={cyc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        {cyc.name}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {dayjs(cyc.startDate).format('YYYY-MM-DD')}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {dayjs(cyc.endDate).format('YYYY-MM-DD')}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                            cyc.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-700/40 text-slate-400 border-slate-600'
                          }`}
                        >
                          {cyc.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-indigo-400">
                        {cyc._count?.reviews || 0} reviews
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {dayjs(cyc.createdAt).format('YYYY-MM-DD')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Cycle Modal */}
      {isCycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white">Create Evaluation Cycle</h3>
              <button
                type="button"
                onClick={() => setIsCycleModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCycleMutation.mutate(cycleForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cycle Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 2026 Annual Appraisal"
                  value={cycleForm.name}
                  onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={cycleForm.startDate}
                    onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={cycleForm.endDate}
                    onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCycleMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {createCycleMutation.isPending ? 'Creating...' : 'Create Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white">Record Performance Review</h3>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reviewForm.cycleId) {
                  toast.error('Please select an evaluation cycle');
                  return;
                }
                if (!reviewForm.employeeId) {
                  toast.error('Please enter an Employee ID');
                  return;
                }
                createReviewMutation.mutate(reviewForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Evaluation Cycle *</label>
                <select
                  required
                  value={reviewForm.cycleId}
                  onChange={(e) => setReviewForm({ ...reviewForm, cycleId: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select a Cycle</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Employee UUID *</label>
                <input
                  type="text"
                  required
                  placeholder="Paste Employee ID"
                  value={reviewForm.employeeId}
                  onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Rating (1.0 to 5.0) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  required
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Comments & Appraisal Notes</label>
                <textarea
                  rows={3}
                  placeholder="Key accomplishments, growth areas, competency notes..."
                  value={reviewForm.comments}
                  onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createReviewMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
