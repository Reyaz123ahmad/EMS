import * as emailIntegration from '../integrations/email/email.service.js';

export const sendEmail = emailIntegration.sendEmail;
export const sendOTPEmail = emailIntegration.sendOTPEmail;
export const sendOtpEmail = emailIntegration.sendOtpEmail;
export const sendCredentialsEmail = emailIntegration.sendCredentialsEmail;
export const sendPasswordResetEmail = emailIntegration.sendPasswordResetEmail;
export const sendWelcomeEmail = emailIntegration.sendWelcomeEmail;
export const sendDocumentApprovalEmail = emailIntegration.sendDocumentApprovalEmail;
export const sendDocumentRejectionEmail = emailIntegration.sendDocumentRejectionEmail;

export default emailIntegration.default;
