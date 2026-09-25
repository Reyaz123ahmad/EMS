import React, { useState } from 'react';
import useAuthStore from '../../store/auth.store';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { User, Mail, Phone, Building, Briefcase, Calendar, ShieldCheck, Save } from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || 'Rahul Sharma',
    email: user?.email || 'user@example.com',
    phone: user?.phone || '+91 9876543210',
    department: 'Software Engineering',
    designation: 'Senior Full Stack Engineer',
    joiningDate: '2024-03-15',
    emergencyContact: '+91 9123456780'
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Profile details updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-0 duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          My Profile & Information
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, work credentials, and emergency contact information.
        </p>
      </div>

      {/* User Hero Banner */}
      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md flex flex-col sm:flex-row items-center gap-6">
        <Avatar name={formData.name} size="2xl" status="online" />
        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{formData.name}</h2>
            <Badge variant="primary" size="sm">
              {user?.roles?.[0] || 'Employee'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">{formData.designation} • {formData.department}</p>
          <p className="text-[11px] text-slate-400">Employee Code: <span className="font-semibold text-slate-700 dark:text-slate-300">#EMP001</span></p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
          Personal & Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={User}
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            disabled
            icon={Mail}
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            icon={Phone}
          />
          <Input
            label="Emergency Contact"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            icon={Phone}
          />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Work & Department Info
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Department"
            value={formData.department}
            disabled
            icon={Building}
          />
          <Input
            label="Designation"
            value={formData.designation}
            disabled
            icon={Briefcase}
          />
          <Input
            label="Joining Date"
            value={formData.joiningDate}
            disabled
            icon={Calendar}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" size="md" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
