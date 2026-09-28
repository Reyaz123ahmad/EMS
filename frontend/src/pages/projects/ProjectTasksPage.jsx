import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckSquare, 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  User, 
  ArrowLeft,
  Calendar,
  Flag,
  Plus,
  X
} from 'lucide-react';
import projectService from '../../services/project.service.js';
import employeeService from '../../services/employee.service.js';

export default function ProjectTasksPage() {
  const { projectId = 'all' } = useParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskError, setTaskError] = useState('');

  const [newTaskData, setNewTaskData] = useState({
    projectId: projectId !== 'all' ? projectId : '',
    title: '',
    description: '',
    assigneeId: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: ''
  });

  // 1. Fetch Project Tasks
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => projectService.getProjectTasks(projectId)
  });

  // 2. Fetch Current Project Detail (if viewing a specific project's task board)
  const { data: currentProject } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: () => projectService.getProjectDetail(projectId),
    enabled: Boolean(projectId && projectId !== 'all')
  });

  // 3. Fetch Projects (for project selector if on all tasks board)
  const { data: projectsData } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectService.getProjects(),
    enabled: isAddTaskModalOpen && projectId === 'all'
  });

  // 4. Fetch Employees (for assignee selector)
  const { data: employeesData } = useQuery({
    queryKey: ['employees-assignee-dropdown'],
    queryFn: () => employeeService.getEmployees(),
    enabled: isAddTaskModalOpen
  });

  const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
  const allEmployees = Array.isArray(employeesData)
    ? employeesData
    : (employeesData?.employees || employeesData?.data?.employees || []);

  const tasks = Array.isArray(data) ? data : (data?.tasks || []);

  // 4. Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: (payload) => {
      const targetProjId = projectId !== 'all' ? projectId : payload.projectId;
      return projectService.createProjectTask(targetProjId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      setIsAddTaskModalOpen(false);
      setNewTaskData({
        projectId: projectId !== 'all' ? projectId : '',
        title: '',
        description: '',
        assigneeId: '',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: ''
      });
      setTaskError('');
    },
    onError: (err) => {
      setTaskError(err.response?.data?.message || err.message || 'Failed to create task');
    }
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    setTaskError('');
    const targetProjId = projectId !== 'all' ? projectId : newTaskData.projectId;
    if (!targetProjId) {
      setTaskError('Please select a project for this task');
      return;
    }
    if (!newTaskData.title.trim()) {
      setTaskError('Task title is required');
      return;
    }
    createTaskMutation.mutate(newTaskData);
  };

  const filteredTasks = tasks.filter(t => {
    const isDone = t.status === 'COMPLETED' || t.status === 'DONE';
    const matchesStatus = 
      statusFilter === 'ALL' || 
      t.status === statusFilter || 
      (statusFilter === 'COMPLETED' && isDone) ||
      (statusFilter === 'TODO' && (t.status === 'TODO' || t.status === 'PENDING' || t.status === 'BACKLOG'));
      
    if (!matchesStatus) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    const title = (t.title || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    const empName = `${t.employee?.firstName || ''} ${t.employee?.lastName || ''}`.toLowerCase();
    return title.includes(term) || desc.includes(term) || empName.includes(term);
  });

  const todoCount = tasks.filter(t => t.status === 'TODO' || t.status === 'PENDING' || t.status === 'BACKLOG').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {projectId !== 'all' && (
            <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-2 transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
            </Link>
          )}
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-indigo-400" />
            Project Tasks & Deliverables
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track agile project task boards, milestones, assignees, priorities, and completion statuses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNewTaskData(prev => ({ ...prev, projectId: projectId !== 'all' ? projectId : '' }));
              setIsAddTaskModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Task
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1.5">{tasks.length}</h3>
          <p className="text-xs text-slate-500 mt-2">Active project items</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">To Do / Backlog</p>
          <h3 className="text-2xl font-bold text-amber-400 mt-1.5">{todoCount}</h3>
          <p className="text-xs text-amber-400/80 mt-2">Scheduled tasks</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
          <h3 className="text-2xl font-bold text-sky-400 mt-1.5">{inProgressCount}</h3>
          <p className="text-xs text-sky-400/80 mt-2">Under active development</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1.5">{completedCount}</h3>
          <p className="text-xs text-emerald-400/80 mt-2">Verified & delivered</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, description or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading project tasks...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Unable to load tasks</h3>
            <p className="text-sm text-slate-400">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckSquare className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-medium text-slate-300">No project tasks found</h3>
            <p className="text-sm text-slate-500">Tasks assigned to project milestones will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Task Name & Details</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.map((t) => {
                  const emp = t.employee || {};
                  const isDone = t.status === 'COMPLETED' || t.status === 'DONE';
                  const isInProg = t.status === 'IN_PROGRESS';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-100">{t.title || 'Untitled Task'}</p>
                        <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">{t.description || 'No description provided'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {emp.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-200">{emp.firstName || 'Unassigned'} {emp.lastName || ''}</p>
                            <p className="text-[11px] text-slate-400">{emp.employeeCode || ''}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          t.priority === 'HIGH' || t.priority === 'URGENT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          t.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          <Flag className="w-3 h-3" />
                          {t.priority || 'NORMAL'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Deadline'}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          isInProg ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {t.status || 'TODO'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
                Add New Project Task
              </h3>
              <button
                onClick={() => setIsAddTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {taskError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{taskError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              {/* If on a specific project page, show the auto-injected project banner */}
              {projectId !== 'all' ? (
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Target Project (Auto-Assigned)</span>
                    <span className="text-xs font-semibold text-slate-200">{currentProject?.name || 'Active Project Workspace'}</span>
                    {currentProject?.client && (
                      <span className="text-[11px] text-slate-400 ml-2">• Client: {currentProject.client.name || currentProject.client.companyName}</span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Bound to Project
                  </span>
                </div>
              ) : (
                /* If on all tasks page, render required project selection dropdown */
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Project <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={newTaskData.projectId}
                    onChange={(e) => setNewTaskData({ ...newTaskData, projectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="">-- Choose Project Workspace --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.client ? `(${p.client.name || p.client.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Task Title */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement authentication middleware"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Deliverable Specs
                </label>
                <textarea
                  rows={2.5}
                  placeholder="Detailed requirements for the assignee..."
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assign Team Member
                </label>
                <select
                  value={newTaskData.assigneeId}
                  onChange={(e) => setNewTaskData({ ...newTaskData, assigneeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">-- Unassigned (Backlog) --</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || 'EMP'}{emp.department?.name ? ` • ${emp.department.name}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority & Status Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={newTaskData.status}
                    onChange={(e) => setNewTaskData({ ...newTaskData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={newTaskData.dueDate}
                  onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {createTaskMutation.isPending && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
