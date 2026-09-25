import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEmployee, useUpdateEmployee } from '../../hooks/useEmployee.js';
import { useBranches, useDepartments, useDesignations } from '../../hooks/useOrganization.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';

export function EditEmployeePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: empData, isLoading } = useEmployee(id);
  const updateMutation = useUpdateEmployee();

  const { data: branchData } = useBranches();
  const { data: deptData } = useDepartments();
  const { data: desigData } = useDesignations();

  const branches = branchData?.data?.branches || [];
  const departments = deptData?.data?.departments || [];
  const designations = desigData?.data?.designations || [];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    employmentType: 'FULL_TIME',
    branchId: '',
    departmentId: '',
    designationId: '',
    status: 'ACTIVE'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (empData?.data?.employee) {
      const emp = empData.data.employee;
      setFormData({
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        phone: emp.phone || '',
        employmentType: emp.employmentType || 'FULL_TIME',
        branchId: emp.branchId || '',
        departmentId: emp.departmentId || '',
        designationId: emp.designationId || '',
        status: emp.status || 'ACTIVE'
      });
    }
  }, [empData]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      setSuccessMsg('Employee profile updated successfully!');
      setTimeout(() => {
        navigate(`/employees/${id}`);
      }, 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update employee profile.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const employee = empData?.data?.employee;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/employees" className="hover:text-white transition-colors">Employees</Link>
            <span>/</span>
            <Link to={`/employees/${id}`} className="hover:text-white transition-colors">{employee?.firstName} {employee?.lastName}</Link>
            <span>/</span>
            <span className="text-slate-200">Edit</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Edit Employee Profile</h1>
        </div>

        <Link to={`/employees/${id}`}>
          <Button variant="outline" size="sm" className="border-slate-700">
            Cancel
          </Button>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          {successMsg}
        </div>
      )}

      <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                First Name *
              </label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="bg-slate-950/60 border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Last Name *
              </label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="bg-slate-950/60 border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <Input
                value={employee?.email || ''}
                disabled
                className="bg-slate-950/30 border-slate-800 text-slate-500 cursor-not-allowed"
              />
              <span className="text-xs text-slate-500 mt-1 block">Email cannot be modified directly.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Phone Number
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 555 0192"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Branch
              </label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Branch (Optional)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.city || 'Main'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Department
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Department (Optional)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Designation
              </label>
              <select
                name="designationId"
                value={formData.designationId}
                onChange={handleChange}
                className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Designation (Optional)</option>
                {designations.map((des) => (
                  <option key={des.id} value={des.id}>{des.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Employment Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
            <Link to={`/employees/${id}`}>
              <Button type="button" variant="outline" className="border-slate-700">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              isLoading={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default EditEmployeePage;
