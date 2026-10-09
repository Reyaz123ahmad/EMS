import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Award,
  Star,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  UserCheck,
  Target,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import performanceService from '../../services/performance.service.js';
import useAuthStore from '../../store/auth.store.js';

export default function TeamPerformancePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isEvaluateModalOpen, setIsEvaluateModalOpen] = useState(false);

  const [evaluateForm, setEvaluateForm] = useState({
    cycleId: '',
    rating: 4.5,
    comments: '',
    status: 'COMPLETED'
  });

  // Queries
  const teamQuery = useQuery({
    queryKey: ['team-performance'],
    queryFn: () => performanceService.getTeamPerformance()
  });

  const cyclesQuery = useQuery({
    queryKey: ['performance-cycles'],
    queryFn: () => performanceService.getCycles()
  });

  const teamData = teamQuery.data || {};
  const teamMembers = Array.isArray(teamData.team) ? teamData.team : [];
  const cycles = Array.isArray(cyclesQuery.data) ? cyclesQuery.data : (cyclesQuery.data?.cycles || []);
  const stats = teamData.stats || {
    totalMembers: teamMembers.length,
    completedReviews: 0,
    pendingReviews: 0,
    avgRating: 0
  };

  // Submit Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: (data) => performanceService.createReview(data),
    onSuccess: () => {
      toast.success('Evaluation saved successfully');
      queryClient.invalidateQueries({ queryKey: ['team-performance'] });
      setIsEvaluateModalOpen(false);
      setSelectedMember(null);
      setEvaluateForm({
        cycleId: '',
        rating: 4.5,
        comments: '',
        status: 'COMPLETED'
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit evaluation');
    }
  });

  const filteredTeam = useMemo(() => {
    return teamMembers.filter((m) => {
      const term = search.toLowerCase();
      const name = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
      const code = (m.employeeCode || '').toLowerCase();
      const desig = (m.designation?.name || '').toLowerCase();
      return !search || name.includes(term) || code.includes(term) || desig.includes(term);
    });
  }, [teamMembers, search]);

  const handleOpenEvaluate = (member) => {
    setSelectedMember(member);
    const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];
    setEvaluateForm({
      cycleId: activeCycle?.id || '',
      rating: 4.5,
      comments: '',
      status: 'COMPLETED'
    });
    setIsEvaluateModalOpen(true);
  };

  const renderRatingStars = (rating) => {
    if (rating === null || rating === undefined) {
      return <span className="text-slate-500 italic">Not rated</span>;
    }
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
            <Users className="h-4 w-4" />
            <span>Team Oversight & Appraisals</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Team Performance
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Competency evaluations, KPI goals, ratings, and performance appraisals for direct reports
          </p>
        </div>

        <button
          type="button"
          onClick={() => teamQuery.refetch()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${teamQuery.isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Team Size</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{stats.totalMembers}</div>
            <p className="mt-1 text-[11px] text-slate-400">Direct subordinates</p>
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
            <div className="text-2xl font-black text-white">{stats.completedReviews}</div>
            <p className="mt-1 text-[11px] text-emerald-400">Evaluations submitted</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Team Rating</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{stats.avgRating} <span className="text-sm font-normal text-slate-400">/ 5.0</span></div>
            <p className="mt-1 text-[11px] text-slate-400">Mean evaluation score</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Appraisals</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{stats.pendingReviews}</div>
            <p className="mt-1 text-[11px] text-purple-400">Awaiting submission</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search team member by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Team Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Team Member</th>
                <th className="px-5 py-3.5">Designation</th>
                <th className="px-5 py-3.5">Latest Rating</th>
                <th className="px-5 py-3.5">Appraisal Feedback</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {teamQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                      <span>Loading team performance data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No team members found reporting to you.
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => {
                  const latestReview = (member.performanceReviews || [])[0];
                  return (
                    <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-300">
                            {member.firstName?.[0] || 'M'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {member.employeeCode || 'N/A'} • {member.department?.name || 'Department'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {member.designation?.name || 'Staff Member'}
                      </td>
                      <td className="px-5 py-4">
                        {renderRatingStars(latestReview?.rating)}
                      </td>
                      <td className="px-5 py-4 max-w-xs text-slate-300 truncate">
                        {latestReview?.comments || 'No feedback recorded yet'}
                      </td>
                      <td className="px-5 py-4">
                        {latestReview ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                              latestReview.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {latestReview.status === 'COMPLETED' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {latestReview.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEvaluate(member)}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluate Member Modal */}
      {isEvaluateModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Evaluate {selectedMember.firstName} {selectedMember.lastName}
                </h3>
                <p className="text-xs text-indigo-400">Code: {selectedMember.employeeCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEvaluateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!evaluateForm.cycleId) {
                  toast.error('Please select an appraisal cycle');
                  return;
                }
                submitReviewMutation.mutate({
                  employeeId: selectedMember.id,
                  ...evaluateForm
                });
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Evaluation Cycle *</label>
                <select
                  required
                  value={evaluateForm.cycleId}
                  onChange={(e) => setEvaluateForm({ ...evaluateForm, cycleId: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select Cycle</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Performance Rating (1.0 to 5.0) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  required
                  value={evaluateForm.rating}
                  onChange={(e) => setEvaluateForm({ ...evaluateForm, rating: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Manager Feedback & Appraisal Notes</label>
                <textarea
                  rows={4}
                  placeholder="Key contributions, quality of deliverables, leadership, areas of improvement..."
                  value={evaluateForm.comments}
                  onChange={(e) => setEvaluateForm({ ...evaluateForm, comments: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEvaluateModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitReviewMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {submitReviewMutation.isPending ? 'Saving...' : 'Save Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
