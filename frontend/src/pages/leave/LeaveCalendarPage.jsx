import React, { useState } from 'react';
import LeaveCalendar from '../../components/leave/LeaveCalendar';
import LeaveApprovalModal from '../../components/leave/LeaveApprovalModal';
import { useLeaveCalendar, useApproveLeave, useRejectLeave } from '../../hooks/useLeave';
import { useAuthStore } from '../../store/authStore';

export default function LeaveCalendarPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: calendarData, refetch } = useLeaveCalendar({
    companyId,
    month,
    year,
  });

  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();

  const leaves = calendarData?.data?.data || calendarData?.data || [];

  const handleSelectLeave = (leave) => {
    setSelectedLeave(leave);
    setIsModalOpen(true);
  };

  const handleApprove = async (id, remarks) => {
    await approveLeave.mutateAsync({ id, approvedBy: user?.id, remarks });
    setIsModalOpen(false);
    refetch();
  };

  const handleReject = async (id, remarks) => {
    await rejectLeave.mutateAsync({ id, rejectedBy: user?.id, remarks });
    setIsModalOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <LeaveCalendar
        month={month}
        year={year}
        leaves={leaves}
        onMonthChange={setMonth}
        onYearChange={setYear}
        onSelectLeave={handleSelectLeave}
      />

      <LeaveApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedLeave}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={approveLeave.isPending || rejectLeave.isPending}
      />
    </div>
  );
}
