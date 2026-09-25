import AIModuleService from './ai.service.js';

export class AIController {
  static async getEmployeePerformance(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { period } = req.query;
      const companyId = req.user.companyId;

      const result = await AIModuleService.getEmployeePerformance(employeeId, companyId, period);
      res.json({
        status: 'ok',
        message: 'Employee performance AI insight retrieved',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeImprovementPlan(req, res, next) {
    try {
      const { employeeId } = req.params;
      const companyId = req.user.companyId;

      const result = await AIModuleService.getEmployeeImprovementPlan(employeeId, companyId);
      res.json({
        status: 'ok',
        message: 'Employee improvement plan generated',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCompanyAnalytics(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { period } = req.query;

      const result = await AIModuleService.getCompanyAnalytics(companyId, period);
      res.json({
        status: 'ok',
        message: 'Company AI analytics retrieved',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPlatformAnalytics(req, res, next) {
    try {
      const { period } = req.query;
      const result = await AIModuleService.getPlatformAnalytics(period);
      res.json({
        status: 'ok',
        message: 'Platform AI analytics retrieved',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAttritionPrediction(req, res, next) {
    try {
      const { employeeId } = req.params;
      const companyId = req.user.companyId;

      const result = await AIModuleService.getAttritionPrediction(employeeId, companyId);
      res.json({
        status: 'ok',
        message: 'Attrition prediction analysis retrieved',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAttendancePrediction(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { month } = req.query;

      const result = await AIModuleService.getAttendancePrediction(companyId, month);
      res.json({
        status: 'ok',
        message: 'Attendance prediction forecast retrieved',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAnomalyDetection(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { dataType } = req.query;

      const result = await AIModuleService.getAnomalyDetection(companyId, dataType);
      res.json({
        status: 'ok',
        message: 'AI Anomaly detection audit completed',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getBusinessRecommendations(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await AIModuleService.getBusinessRecommendations(companyId);
      res.json({
        status: 'ok',
        message: 'Business optimization recommendations retrieved',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async chat(req, res, next) {
    try {
      const { message, context } = req.body;
      const userId = req.user.id;
      const companyId = req.user.companyId;

      const result = await AIModuleService.chat({ userId, companyId, message, context });
      res.json({
        status: 'ok',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUsageStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await AIModuleService.getUsageStats(companyId);
      res.json({
        status: 'ok',
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }

  static async listInsights(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { employeeId, insightType, page = 1, limit = 20 } = req.query;

      const result = await AIModuleService.listSavedInsights({
        companyId,
        employeeId,
        insightType,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      });

      res.json({
        status: 'ok',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export default AIController;
