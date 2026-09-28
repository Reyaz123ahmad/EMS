import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FolderOpen, 
  ArrowLeft, 
  CheckSquare, 
  Users, 
  Layers, 
  Building2, 
  Clock, 
  AlertCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Calendar,
  Flag
} from 'lucide-react';
import projectService from '../../services/project.service.js';
import taskService from '../../services/task.service.js';

export default function MyProjectDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('tasks'); // tasks, overview, team, milestones
  const [taskDrafts, setTaskDrafts] = useState({}); // { [taskId]: { status, comment } }
  const [updateMsg, setUpdateMsg] = useState({}); // { [taskId]: 'Updated!' }

  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['my-project-detail', id],
    queryFn: () => projectService.getMyProjectDetail(id)
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ taskId, status, comment }) => taskService.updateTaskProgress(taskId, { status, comment }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['my-project-detail', id] });
      setUpdateMsg(prev => ({ ...prev, [vars.taskId]: 'Progress updated successfully!' }));
      setTimeout(() => {
        setUpdateMsg(prev => {
          const copy = { ...prev };
          delete copy[vars.taskId];
          return copy;
        });
      }, 3000);
    }
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-12 text-center space-y-4 rounded-xl bg-slate-900 border border-slate-800">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-100">Project Not Found</h2>
        <p className="text-sm text-slate-400">{error?.message || 'Unable to find this project.'}</p>
        <Link to="/my-projects" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Return to My Projects
        </Link>
      </div>
    );
  }

  const client = project.client || {};
  const myTasks = project.myTasks || [];
  const members = project.members || [];
  const milestones = project.milestones || [];

  const handleTaskStatusChange = (taskId, newStatus) => {
    setTaskDrafts(prev => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        status: newStatus
      }
    }));
  };

  const handleTaskCommentChange = (taskId, newComment) => {
    setTaskDrafts(prev => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        comment: newComment
      }
    }));
  };

  const handleSaveTaskProgress = (task) => {
    const draft = taskDrafts[task.id] || {};
    const status = draft.status || task.status;
    const comment = draft.comment || '';

    updateProgressMutation.mutate({
      taskId: task.id,
      status,
      comment
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/my-projects" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-2 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                My Role: {project.myRole || 'MEMBER'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Client: <strong className="text-slate-200">{client.name || 'Corporate'}</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto">
        {[
          { key: 'tasks', label: `My Tasks (${myTasks.length})`, icon: CheckSquare },
          { key: 'overview', label: 'Overview', icon: FolderOpen },
          { key: 'team', label: `Team Members (${members.length})`, icon: Users },
          { key: 'milestones', label: `Milestones (${milestones.length})`, icon: Layers }
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

      {/* TAB 1: MY TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Assigned Tasks & Sprint Updates</h3>
              <p className="text-xs text-slate-400">Update execution status and post progress notes on your tasks</p>
            </div>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <CheckSquare className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-medium text-slate-300">No tasks assigned to you</h4>
              <p className="text-xs text-slate-500">Your manager will assign project tasks and milestones to your account.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myTasks.map((task) => {
                const currentStatus = taskDrafts[task.id]?.status !== undefined ? taskDrafts[task.id].status : task.status;
                const isSaving = updateProgressMutation.isPending && updateProgressMutation.variables?.taskId === task.id;
                const successMsg = updateMsg[task.id];

                return (
                  <div key={task.id} className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-100">{task.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {task.priority || 'NORMAL'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{task.description || 'No description provided'}</p>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-2">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="DONE">DONE / COMPLETED</option>
                        </select>

                        <button
                          onClick={() => handleSaveTaskProgress(task)}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {isSaving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                          Update
                        </button>
                      </div>
                    </div>

                    {successMsg && (
                      <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {successMsg}
                      </p>
                    )}

                    {/* Progress Comment Box */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Add progress note or blocker comment (optional)..."
                          value={taskDrafts[task.id]?.comment || ''}
                          onChange={(e) => handleTaskCommentChange(task.id, e.target.value)}
                          className="w-full pl-3 pr-20 py-2 bg-slate-800/70 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Task Comments History */}
                    {(task.comments || []).length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recent Activity & Notes</p>
                        {task.comments.slice(-2).map((c) => (
                          <div key={c.id} className="p-2 rounded bg-slate-800/40 text-xs text-slate-300 flex justify-between">
                            <span>{c.content}</span>
                            <span className="text-slate-500 text-[10px]">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-100">Project Overview</h3>
          <p className="text-sm text-slate-300">{project.description || 'No detailed description available.'}</p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <div>Start Date: <strong className="text-slate-200">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</strong></div>
            <div>Target End Date: <strong className="text-slate-200">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</strong></div>
          </div>
        </div>
      )}

      {/* TAB 3: TEAM */}
      {activeTab === 'team' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-100">Project Collaborators</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((m) => (
              <div key={m.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-100">{m.employee?.firstName} {m.employee?.lastName}</p>
                  <p className="text-slate-400">{m.employee?.employeeCode}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-indigo-400 font-bold bg-indigo-500/10">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-100">Project Milestones</h3>
          {milestones.length === 0 ? (
            <p className="text-xs text-slate-500">No milestones configured.</p>
          ) : (
            milestones.map((milestone) => (
              <div key={milestone.id} className="p-3 rounded-lg bg-slate-800/50 text-xs flex justify-between">
                <span>{milestone.name}</span>
                <span className="text-emerald-400 font-semibold">{milestone.status}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
