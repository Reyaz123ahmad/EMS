import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Briefcase, 
  ArrowLeft, 
  Building2, 
  UserCheck, 
  Users,
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Plus,
  Check,
  Search,
  X
} from 'lucide-react';
import projectService from '../../services/project.service.js';
import clientService from '../../services/client.service.js';
import employeeService from '../../services/employee.service.js';

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    managerId: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'ACTIVE'
  });

  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch Clients
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-dropdown'],
    queryFn: () => clientService.getClients()
  });

  const clients = Array.isArray(clientsData) ? clientsData : (clientsData?.clients || []);

  // 2. Fetch Managers (MANAGER role only)
  const { data: managersData, isLoading: managersLoading } = useQuery({
    queryKey: ['managers-dropdown'],
    queryFn: () => employeeService.getManagers()
  });

  const managers = Array.isArray(managersData) ? managersData : (managersData?.managers || []);

  // 3. Fetch All Employees (for Team Members multi-select)
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-team-dropdown'],
    queryFn: () => employeeService.getEmployees()
  });

  const allEmployees = Array.isArray(employeesData)
    ? employeesData
    : (employeesData?.employees || employeesData?.data?.employees || []);

  // 4. Create Project Mutation
  const createProjectMutation = useMutation({
    mutationFn: (payload) => projectService.createProject(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      const createdId = res?.data?.id || res?.id;
      if (createdId) {
        navigate(`/projects/${createdId}`);
      } else {
        navigate('/projects');
      }
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create project');
    }
  });

  const toggleMember = (empId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Project Name is required');
      return;
    }
    if (!formData.clientId) {
      setErrorMsg('Please select a Client for this project');
      return;
    }
    if (!formData.managerId) {
      setErrorMsg('Please assign a Project Manager (MANAGER role)');
      return;
    }

    createProjectMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      clientId: formData.clientId,
      managerId: formData.managerId,
      memberIds: selectedMemberIds,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      status: formData.status
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
        </Link>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Briefcase className="w-7 h-7 text-indigo-400" />
          Create New Project Workspace
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Initiate a new client deliverable, configure financial scope, and designate project leadership
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Project Title / Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Healthcare Mobile App Platform v2.0"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Project Description & Scope
            </label>
            <textarea
              rows={3}
              placeholder="Outline project objectives, key milestones, deliverables, and technical expectations..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Client & Manager Selectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Select Client */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Select Corporate Client <span className="text-rose-400">*</span></span>
                <Link to="/clients" className="text-xs font-normal text-indigo-400 hover:underline">
                  + New Client
                </Link>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {clientsLoading && <p className="text-xs text-slate-500 mt-1">Loading clients...</p>}
            </div>

            {/* Select Manager */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Designate Project Manager <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                >
                  <option value="">-- Choose Manager (Role: MANAGER) --</option>
                  {managers.map((m) => {
                    const emp = m.employee || {};
                    const dept = emp.department?.name ? ` • ${emp.department.name}` : '';
                    return (
                      <option key={m.id} value={emp.id || m.id}>
                        {emp.firstName || m.name || m.email} {emp.lastName || ''} ({emp.employeeCode || 'EMP'}{dept})
                      </option>
                    );
                  })}
                </select>
              </div>
              {managersLoading ? (
                <p className="text-xs text-slate-500 mt-1">Loading managers...</p>
              ) : managers.length === 0 ? (
                <p className="text-xs text-amber-400 mt-1">No active users with MANAGER role found. Please assign MANAGER role to an employee.</p>
              ) : null}
            </div>
          </div>

          {/* Select Team Members (Optional Multi-Select) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Team Members <span className="text-slate-500 font-normal lowercase">(optional — can also assign later)</span>
              </label>
              <span className="text-xs text-indigo-400 font-medium">
                {selectedMemberIds.length} {selectedMemberIds.length === 1 ? 'member' : 'members'} selected
              </span>
            </div>

            {/* Selected Members Badges */}
            {selectedMemberIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                {selectedMemberIds.map((empId) => {
                  const emp = allEmployees.find((e) => e.id === empId) || {};
                  return (
                    <span
                      key={empId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode || 'EMP'})
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleMember(empId)}
                        className="hover:text-rose-400 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search Input for Employees */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employees by name, code or department..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Scrollable Employees Selection List */}
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700/80 bg-slate-800/40 divide-y divide-slate-800">
              {employeesLoading ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading employees directory...</div>
              ) : allEmployees.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No employees found.</div>
              ) : (
                allEmployees
                  .filter((emp) => {
                    if (!memberSearch) return true;
                    const term = memberSearch.toLowerCase();
                    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
                    const code = (emp.employeeCode || '').toLowerCase();
                    const dept = (emp.department?.name || '').toLowerCase();
                    return name.includes(term) || code.includes(term) || dept.includes(term);
                  })
                  .map((emp) => {
                    const isSelected = selectedMemberIds.includes(emp.id);
                    const isManager = formData.managerId === emp.id;
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleMember(emp.id)}
                        className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition text-xs ${
                          isSelected
                            ? 'bg-indigo-600/15 text-slate-100'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-600 bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-slate-400 ml-1.5">
                              ({emp.employeeCode || 'EMP'})
                            </span>
                            {emp.department?.name && (
                              <span className="text-slate-500 ml-1.5">• {emp.department.name}</span>
                            )}
                            {isManager && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Designated Manager
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {isSelected ? 'Selected' : 'Click to add'}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Timeline & Budget Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Estimated Delivery Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contract Budget (INR ₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 500000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          {/* Status Select */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Initial Project Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full md:w-1/3 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="ACTIVE">ACTIVE (In Progress)</option>
              <option value="PLANNING">PLANNING (Backlog)</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
          <Link
            to="/projects"
            className="px-4 py-2.5 text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={createProjectMutation.isPending}
            className="px-6 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {createProjectMutation.isPending && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}
