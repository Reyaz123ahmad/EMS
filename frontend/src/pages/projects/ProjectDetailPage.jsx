import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Briefcase, 
  ArrowLeft, 
  Building2, 
  UserCheck, 
  Users, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  Flag, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle,
  TrendingUp,
  X,
  Clock,
  CheckCircle2,
  Layers
} from 'lucide-react';
import projectService from '../../services/project.service.js';
import employeeService from '../../services/employee.service.js';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview'); // overview, team, requirements, tasks, milestones, comments
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [memberFormData, setMemberFormData] = useState({ employeeId: '', role: 'DEVELOPER' });
  const [actionError, setActionError] = useState('');

  // 1. Fetch Project Details
  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: () => projectService.getProjectDetail(id)
  });

  // 2. Fetch Member Progress
  const { data: memberProgressData } = useQuery({
    queryKey: ['project-member-progress', id],
    queryFn: () => projectService.getMemberProgress(id),
    enabled: activeTab === 'team' || activeTab === 'overview'
  });

  // 3. Fetch Managers (for Manager Assignment modal)
  const { data: managersData } = useQuery({
    queryKey: ['managers-dropdown'],
    queryFn: () => employeeService.getManagers(),
    enabled: isManagerModalOpen
  });

  // 4. Fetch Employees (for Add Member modal)
  const { data: employeesData } = useQuery({
    queryKey: ['employees-all-dropdown'],
    queryFn: () => employeeService.getEmployees(),
    enabled: isAddMemberModalOpen
  });

  const managers = Array.isArray(managersData) ? managersData : (managersData?.managers || []);
  const allEmployees = Array.isArray(employeesData) 
    ? employeesData 
    : (employeesData?.employees || employeesData?.data?.employees || []);

  const members = project?.members || [];
  const memberProgress = Array.isArray(memberProgressData) ? memberProgressData : (memberProgressData?.data || []);

  // Assign Manager Mutation
  const assignManagerMutation = useMutation({
    mutationFn: (mgrId) => projectService.assignManager(id, mgrId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-detail', id] });
      setIsManagerModalOpen(false);
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.response?.data?.message || err.message || 'Failed to assign manager');
    }
  });

  // Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: (payload) => projectService.addMember(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['project-member-progress', id] });
      setIsAddMemberModalOpen(false);
      setMemberFormData({ employeeId: '', role: 'DEVELOPER' });
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.response?.data?.message || err.message || 'Failed to add member');
    }
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => projectService.removeMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['project-member-progress', id] });
    }
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading project workspace...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-12 text-center space-y-4 rounded-xl bg-slate-900 border border-slate-800">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-100">Project Not Found</h2>
        <p className="text-sm text-slate-400">{error?.message || 'The requested project could not be found or access is restricted.'}</p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Projects Directory
        </Link>
      </div>
    );
  }

  const client = project.client || {};
  const manager = project.manager || {};
  const tasks = project.tasks || [];
  const milestones = project.milestones || [];
  const requirements = project.requirements || [];
  const comments = project.comments || [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.status === 'COMPLETED' ? 100 : 25);

  return (
    <div className="space-y-6">
      {/* Header & Back link */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-2 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                project.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                project.status === 'ACTIVE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {project.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Client: <strong className="text-slate-200">{client.name || 'Unassigned'}</strong> {client.companyName ? `(${client.companyName})` : ''}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/projects/${project.id}/tasks`}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 shadow-sm"
            >
              <CheckSquare className="w-4 h-4" /> Open Tasks Sprint
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: Briefcase },
          { key: 'team', label: `Team & Progress (${members.length})`, icon: Users },
          { key: 'requirements', label: `Requirements (${requirements.length})`, icon: Flag },
          { key: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckSquare },
          { key: 'milestones', label: `Milestones (${milestones.length})`, icon: Layers },
          { key: 'comments', label: `Discussions (${comments.length})`, icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</p>
              <h3 className="text-2xl font-bold text-indigo-400 mt-1.5">{overallProgress}%</h3>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contract Budget</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1.5">
                {project.budget ? `₹${Number(project.budget).toLocaleString('en-IN')}` : 'Undisclosed'}
              </h3>
              <p className="text-xs text-slate-500 mt-2">Allocated financial commitment</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Leadership</p>
              <h3 className="text-lg font-bold text-emerald-400 mt-1.5 truncate">
                {manager.firstName ? `${manager.firstName} ${manager.lastName || ''}` : 'No Manager'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{manager.employeeCode || 'Designated Lead'}</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sprint Members</p>
              <h3 className="text-2xl font-bold text-sky-400 mt-1.5">{members.length}</h3>
              <p className="text-xs text-slate-500 mt-2">Assigned engineers & staff</p>
            </div>
          </div>

          {/* Description & Metadata Card */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-100">Project Scope & Description</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {project.description || 'No detailed description provided for this project deliverable.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Start Date: <strong className="text-slate-200">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Immediate'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Target Deadline: <strong className="text-slate-200">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Open Sprint'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM & MEMBER PROGRESS (FIX 4 & FIX 11) */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Manager Header Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Project Manager</p>
                <h3 className="text-base font-bold text-slate-100">
                  {manager.firstName ? `${manager.firstName} ${manager.lastName || ''}` : 'No Project Manager Assigned'}
                </h3>
                <p className="text-xs text-slate-400">{manager.employeeCode || manager.email || 'Designate a project manager with MANAGER role'}</p>
              </div>
            </div>

            <button
              onClick={() => { setIsManagerModalOpen(true); setActionError(''); }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {manager.id ? 'Change Manager' : 'Assign Manager'}
            </button>
          </div>

          {/* Team Members List Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Team Members & Individual Progress</h3>
              <p className="text-xs text-slate-400">Track tasks completed, sprint backlog, and throughput per contributor</p>
            </div>

            <button
              onClick={() => { setIsAddMemberModalOpen(true); setActionError(''); }}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Team Member
            </button>
          </div>

          {/* Members Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
            {members.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-base font-medium text-slate-300">No members assigned yet</h4>
                <p className="text-xs text-slate-500">Add engineers, designers, and testers to this project team.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Team Member</th>
                      <th className="px-6 py-4">Project Role</th>
                      <th className="px-6 py-4">Tasks Breakdown</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {members.map((m) => {
                      const emp = m.employee || {};
                      const prog = memberProgress.find(p => p.employeeId === m.employeeId) || {};
                      const totalT = prog.totalTasks || 0;
                      const doneT = prog.completedTasks || 0;
                      const pct = prog.progress || (totalT > 0 ? Math.round((doneT / totalT) * 100) : 0);

                      return (
                        <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                                {emp.firstName?.[0] || 'U'}{emp.lastName?.[0] || ''}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-100">{emp.firstName || ''} {emp.lastName || ''}</p>
                                <p className="text-xs text-slate-400">{emp.employeeCode || emp.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {m.role || 'DEVELOPER'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs">
                            <span className="text-emerald-400 font-bold">{doneT} done</span> / <span className="text-slate-400">{totalT} total</span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => removeMemberMutation.mutate(m.id)}
                              className="text-slate-400 hover:text-rose-400 transition p-1"
                              title="Remove from project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REQUIREMENTS */}
      {activeTab === 'requirements' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-100">Client Requirements & Specifications</h3>
          {requirements.length === 0 ? (
            <p className="text-sm text-slate-500">No specific requirements submitted for this project yet.</p>
          ) : (
            <div className="space-y-3">
              {requirements.map((req) => (
                <div key={req.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-100 text-sm">{req.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{req.description || 'No additional details'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-300">
                    {req.status || 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TASKS */}
      {activeTab === 'tasks' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Project Tasks</h3>
            <Link
              to={`/projects/${project.id}/tasks`}
              className="text-xs font-semibold text-indigo-400 hover:underline"
            >
              Open Full Tasks Board →
            </Link>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-500">No tasks created for this project yet.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-100">{t.title}</p>
                    <p className="text-slate-400">{t.description || 'No description'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-100">Project Milestones & Deliverables</h3>
          {milestones.length === 0 ? (
            <p className="text-sm text-slate-500">No milestones configured for this project deliverable.</p>
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-100 text-sm">{m.name}</h4>
                    <p className="text-slate-400">{m.description || 'Deliverable milestone'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                    {m.status || 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: COMMENTS */}
      {activeTab === 'comments' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-100">Project Discussions</h3>
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">No project comments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs">
                  <p className="text-slate-200">{c.content}</p>
                  <p className="text-slate-500 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ASSIGN MANAGER */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                Assign Project Manager
              </h3>
              <button onClick={() => setIsManagerModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Active Manager (Role: MANAGER)
              </label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="">-- Choose Manager --</option>
                {managers.map((m) => {
                  const emp = m.employee || {};
                  return (
                    <option key={m.id} value={emp.id || m.id}>
                      {emp.firstName || m.name || m.email} {emp.lastName || ''} ({emp.employeeCode || 'EMP'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsManagerModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedManagerId || assignManagerMutation.isPending}
                onClick={() => assignManagerMutation.mutate(selectedManagerId)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-50 flex items-center gap-2"
              >
                {assignManagerMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Save Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEMBER */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Add Team Member
              </h3>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Employee
                </label>
                <select
                  value={memberFormData.employeeId}
                  onChange={(e) => setMemberFormData({ ...memberFormData, employeeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">-- Choose Employee --</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || 'EMP'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Role
                </label>
                <select
                  value={memberFormData.role}
                  onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="DEVELOPER">DEVELOPER</option>
                  <option value="TESTER">TESTER / QA</option>
                  <option value="DESIGNER">DESIGNER / UI-UX</option>
                  <option value="LEAD">TECHNICAL LEAD</option>
                  <option value="DEVOPS">DEVOPS / SRE</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!memberFormData.employeeId || addMemberMutation.isPending}
                onClick={() => addMemberMutation.mutate(memberFormData)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50 flex items-center gap-2"
              >
                {addMemberMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
