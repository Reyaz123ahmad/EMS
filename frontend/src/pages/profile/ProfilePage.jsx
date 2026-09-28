import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/auth.store';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { employeeService } from '../../services/employee.service';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  Save, 
  Camera, 
  Trash2, 
  Lock, 
  Key,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const userRoles = user?.roles || (user?.role ? [user.role] : ['EMPLOYEE']);
  const isEmployee = userRoles.includes('EMPLOYEE') && !userRoles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(r));
  
  const emp = user?.employee;
  const fullName = user?.name || (emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : '') || user?.email?.split('@')[0] || 'User';

  const [formData, setFormData] = useState({
    name: fullName,
    email: user?.email || '',
    phone: emp?.phone || user?.phone || '',
    department: emp?.department?.name || 'Operations',
    designation: emp?.designation?.name || user?.role || 'Staff',
    joiningDate: emp?.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '2024-01-01',
    emergencyContact: emp?.emergencyContact || emp?.emergencyContactPhone || '',
    employeeCode: emp?.employeeCode || '#EMP001'
  });

  const [photoUrl, setPhotoUrl] = useState(emp?.photoUrl || user?.photoUrl || null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const invalidateUserQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['me'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
    queryClient.invalidateQueries({ queryKey: ['auth'] });
    queryClient.invalidateQueries({ queryKey: ['sidebar-user'] });
    queryClient.invalidateQueries({ queryKey: ['employee'] });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const handleSavePhoto = async () => {
    if (!selectedFile && !photoPreview) return;
    setIsUploadingPhoto(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);
      const res = await employeeService.uploadMyPhoto(formDataUpload);
      const updatedUrl = res.photoUrl || res.data?.photoUrl || photoPreview;
      setPhotoUrl(updatedUrl);
      setSelectedFile(null);
      setPhotoPreview(null);
      updateUser({
        ...user,
        photoUrl: updatedUrl,
        employee: {
          ...(user?.employee || {}),
          photoUrl: updatedUrl
        }
      });
      invalidateUserQueries();
      toast.success('Profile photo updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload profile photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await employeeService.deleteMyPhoto();
      setPhotoUrl(null);
      setPhotoPreview(null);
      setSelectedFile(null);
      updateUser({
        ...user,
        photoUrl: null,
        employee: {
          ...(user?.employee || {}),
          photoUrl: null
        }
      });
      invalidateUserQueries();
      toast.success('Profile photo removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove photo');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const payload = {
        phone: formData.phone,
        emergencyContact: formData.emergencyContact,
        emergencyContactPhone: formData.emergencyContact
      };
      if (!isEmployee) {
        payload.name = formData.name;
      }
      await employeeService.updateMyProfile(payload);
      updateUser({
        ...user,
        phone: formData.phone,
        employee: {
          ...(user?.employee || {}),
          phone: formData.phone,
          emergencyContact: formData.emergencyContact
        }
      });
      toast.success('Profile details updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile changes');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const currentDisplayPhoto = photoPreview || photoUrl;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            My Profile & Information
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal details, profile photo, and security preferences.
          </p>
        </div>

        {/* Quick Security Actions */}
        <div className="flex items-center gap-2.5">
          <Link to="/profile/change-password">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              Change Password
            </Button>
          </Link>
          <Link to="/profile/2fa">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              2FA Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* User Hero & Photo Upload Card */}
      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative group">
            {currentDisplayPhoto ? (
              <img
                src={currentDisplayPhoto}
                alt={formData.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-md"
              />
            ) : (
              <Avatar name={formData.name} size="2xl" status="online" />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-md transition-transform active:scale-95"
              title="Upload Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{formData.name}</h2>
              <Badge variant="primary" size="sm">
                {user?.role || user?.roles?.[0] || 'Employee'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formData.designation} • {formData.department}
            </p>
            <p className="text-[11px] text-slate-400">
              Employee Code: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.employeeCode}</span>
            </p>
          </div>
        </div>

        {/* Photo Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {photoPreview && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePhoto}
              isLoading={isUploadingPhoto}
              className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Photo
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-500" />
            {photoUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          {photoUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemovePhoto}
              className="text-red-500 hover:bg-red-500/10 text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Profile Details Form */}
      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
          Personal & Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isEmployee}
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
            placeholder="+91 98765 43210"
            icon={Phone}
          />
          <Input
            label="Emergency Contact"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            placeholder="+91 91234 56780"
            icon={Phone}
          />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Work & Organization Info
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Employee Code"
            value={formData.employeeCode}
            disabled
            icon={Briefcase}
          />
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
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSavingProfile}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
          >
            <Save className="w-4 h-4" />
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
