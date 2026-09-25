import reportsRepository from './reports.repository.js';
import { REPORT_TYPES, EXPORT_FORMATS } from './reports.constants.js';

export const reportsService = {
  async generateReport(type, companyId, filters = {}) {
    let rawData = [];

    switch (type) {
      case REPORT_TYPES.ATTENDANCE:
        rawData = await reportsRepository.getAttendanceReportData(companyId, filters);
        break;
      case REPORT_TYPES.PAYROLL:
        rawData = await reportsRepository.getPayrollReportData(companyId, filters);
        break;
      case REPORT_TYPES.EMPLOYEE:
        rawData = await reportsRepository.getEmployeeReportData(companyId, filters);
        break;
      case REPORT_TYPES.LEAVE:
        rawData = await reportsRepository.getLeaveReportData(companyId, filters);
        break;
      case REPORT_TYPES.OVERTIME:
        rawData = await reportsRepository.getOvertimeReportData(companyId, filters);
        break;
      case REPORT_TYPES.PERFORMANCE:
        rawData = await reportsRepository.getPerformanceReportData(companyId, filters);
        break;
      case REPORT_TYPES.PROJECT:
        rawData = await reportsRepository.getProjectReportData(companyId, filters);
        break;
      case REPORT_TYPES.CLIENT:
        rawData = await reportsRepository.getClientReportData(companyId, filters);
        break;
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }

    // Format into unified table rows
    const rows = this.formatRows(type, rawData);

    return {
      type,
      filters,
      totalRecords: rows.length,
      generatedAt: new Date().toISOString(),
      rows
    };
  },

  formatRows(type, data = []) {
    switch (type) {
      case REPORT_TYPES.ATTENDANCE:
        return data.map((item) => ({
          ID: item.id,
          Employee: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'N/A',
          Code: item.employee?.employeeCode || 'N/A',
          Date: item.attendanceDate ? item.attendanceDate.toISOString().split('T')[0] : 'N/A',
          CheckIn: item.checkInAt ? new Date(item.checkInAt).toLocaleTimeString() : 'N/A',
          CheckOut: item.checkOutAt ? new Date(item.checkOutAt).toLocaleTimeString() : 'N/A',
          Method: item.attendanceMethod || 'MANUAL',
          WorkedMinutes: item.totalWorkedMinutes || 0,
          Status: item.status
        }));

      case REPORT_TYPES.EMPLOYEE:
        return data.map((item) => ({
          ID: item.id,
          Code: item.employeeCode,
          Name: `${item.firstName} ${item.lastName}`,
          Email: item.email,
          Phone: item.phone || 'N/A',
          Department: item.department?.name || 'N/A',
          Designation: item.designation?.name || 'N/A',
          JoiningDate: item.joiningDate ? item.joiningDate.toISOString().split('T')[0] : 'N/A',
          Status: item.status
        }));

      case REPORT_TYPES.LEAVE:
        return data.map((item) => ({
          ID: item.id,
          Employee: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'N/A',
          LeaveType: item.leaveType?.name || 'General',
          StartDate: item.startDate ? item.startDate.toISOString().split('T')[0] : 'N/A',
          EndDate: item.endDate ? item.endDate.toISOString().split('T')[0] : 'N/A',
          TotalDays: item.totalDays ? item.totalDays.toString() : '1',
          Status: item.status
        }));

      case REPORT_TYPES.PAYROLL:
        return data.map((run) => ({
          ID: run.id,
          Period: `${run.month}/${run.year}`,
          TotalGross: run.totalGross ? run.totalGross.toString() : '0',
          TotalDeductions: run.totalDeductions ? run.totalDeductions.toString() : '0',
          TotalNet: run.totalNet ? run.totalNet.toString() : '0',
          Status: run.status
        }));

      default:
        return data;
    }
  },

  async exportReport({ type, filters = {}, format = EXPORT_FORMATS.CSV, companyId, userId }) {
    const report = await this.generateReport(type, companyId, filters);

    const fileName = `${type.toLowerCase()}_report_${Date.now()}.${format.toLowerCase()}`;
    const fileUrl = `https://storage.googleapis.com/ems-reports/${fileName}`;

    const history = await reportsRepository.createReportHistory({
      companyId,
      userId,
      type,
      format,
      fileName,
      fileUrl,
      status: 'COMPLETED',
      filters
    });

    return {
      historyId: history.id,
      fileName,
      fileUrl,
      format,
      totalRows: report.totalRecords,
      data: report.rows
    };
  },

  async getReportStats(companyId) {
    const [attendanceCount, employeeCount, leaveCount, payrollCount] = await Promise.all([
      reportsRepository.getAttendanceReportData(companyId),
      reportsRepository.getEmployeeReportData(companyId),
      reportsRepository.getLeaveReportData(companyId),
      reportsRepository.getPayrollReportData(companyId)
    ]);

    return {
      totalAttendanceLogs: attendanceCount.length,
      totalEmployees: employeeCount.length,
      totalLeaves: leaveCount.length,
      totalPayrollRuns: payrollCount.length
    };
  },

  async getReportHistory(companyId, filters = {}) {
    return reportsRepository.getReportHistories(companyId, filters);
  }
};

export default reportsService;
