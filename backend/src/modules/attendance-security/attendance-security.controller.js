import {
  livenessService,
  fraudDetectionService
} from './attendance-security.service.js';
import {
  detectFaceWithLandmarks,
  detectHeadPose,
  detectBlink
} from '../../services/face.service.js';
import {
  livenessChallengeSchema,
  livenessVerifySchema,
  reviewFraudSignalSchema,
  fraudQuerySchema
} from './attendance-security.validator.js';

export const attendanceSecurityController = {
  /**
   * POST /attendance-security/liveness/detect
   * Real-time continuous landmark, blink & head direction detection
   */
  async detectLiveness(req, res, next) {
    try {
      const { photo } = req.body;
      if (!photo) {
        return res.status(400).json({ status: 'error', message: 'Photo is required for liveness detection' });
      }

      const detection = await detectFaceWithLandmarks(photo);
      if (!detection) {
        return res.status(200).json({
          status: 'ok',
          data: {
            faceDetected: false,
            headDirection: 'UNKNOWN',
            isBlinking: false
          },
          message: 'No face detected in live camera frame'
        });
      }

      const headPose = detectHeadPose(detection.landmarks);
      const blink = detectBlink(detection.landmarks);

      return res.status(200).json({
        status: 'ok',
        data: {
          faceDetected: true,
          headDirection: headPose.direction,
          yaw: headPose.yaw,
          isBlinking: blink.isBlinking,
          ear: blink.ear,
          box: detection.box,
          score: detection.score
        },
        message: 'Liveness detected'
      });
    } catch (err) {
      next(err);
    }
  },
  /**
   * POST /attendance-security/liveness/challenge
   */
  async createLivenessChallenge(req, res, next) {
    try {
      const { error, value } = livenessChallengeSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const userId = req.user?.id || req.user?.userId;
      const employeeId = value?.employeeId || req.user?.employee?.id || userId;
      const challenge = await livenessService.createChallenge(employeeId);
      res.status(200).json({ status: 'ok', data: challenge });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /attendance-security/liveness/verify
   */
  async verifyLiveness(req, res, next) {
    try {
      const { error, value } = livenessVerifySchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const userId = req.user?.id || req.user?.userId;
      const employeeId = value?.employeeId || req.user?.employee?.id || userId;
      const result = await livenessService.verifyChallenge(
        employeeId,
        value.challengeId,
        value.livenessScore,
        value.imageData
      );

      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance-security/fraud-signals
   */
  async getFraudSignals(req, res, next) {
    try {
      const { error, value } = fraudQuerySchema.validate(req.query);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const companyId = req.user?.companyId;
      const { page, limit, ...filters } = value;

      const result = await fraudDetectionService.listFraudSignals(companyId, filters, { page, limit });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /attendance-security/fraud-signals/:id/review
   */
  async reviewFraudSignal(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = reviewFraudSignalSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const reviewedBy = req.user?.email || req.user?.id;
      const signal = await fraudDetectionService.reviewSignal(id, reviewedBy, value.notes, value.actionTaken);

      res.status(200).json({
        status: 'ok',
        message: 'Fraud incident reviewed and status updated.',
        data: { signal }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance-security/fraud-stats
   */
  async getFraudStats(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const stats = await fraudDetectionService.getFraudStats(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  }
};

export default attendanceSecurityController;
