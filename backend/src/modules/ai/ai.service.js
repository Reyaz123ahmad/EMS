import GlobalAIService from '../../services/ai.service.js';
import AIRepository from './ai.repository.js';

export class AIModuleService {
  static async getEmployeePerformance(employeeId, companyId, period) {
    return await GlobalAIService.generateEmployeePerformanceInsight(employeeId, companyId, period);
  }

  static async getEmployeeImprovementPlan(employeeId, companyId) {
    return await GlobalAIService.generateEmployeeImprovementPlan(employeeId, companyId);
  }

  static async getCompanyAnalytics(companyId, period) {
    return await GlobalAIService.generateCompanyAnalytics(companyId, period);
  }

  static async getPlatformAnalytics(period) {
    return await GlobalAIService.generatePlatformAnalytics(period);
  }

  static async getAttritionPrediction(employeeId, companyId) {
    return await GlobalAIService.generateAttritionPrediction(employeeId, companyId);
  }

  static async getAttendancePrediction(companyId, month) {
    return await GlobalAIService.generateAttendancePrediction(companyId, month);
  }

  static async getAnomalyDetection(companyId, dataType) {
    return await GlobalAIService.generateAnomalyDetection(companyId, dataType);
  }

  static async getBusinessRecommendations(companyId) {
    return await GlobalAIService.generateBusinessRecommendations(companyId);
  }

  static async chat({ userId, companyId, message, context, role }) {
    return await GlobalAIService.chat({ userId, companyId, message, context, role });
  }

  static async getUsageStats(companyId) {
    return await GlobalAIService.getAIUsageStats(companyId);
  }

  static async listSavedInsights({ companyId, employeeId, insightType, page, limit }) {
    return await AIRepository.listInsights({ companyId, employeeId, insightType, page, limit });
  }
}

export default AIModuleService;
