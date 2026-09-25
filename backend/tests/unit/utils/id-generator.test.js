import { generateCompanyCode, generateEmployeeCode, generateBranchCode } from '../../../src/utils/id-generator.js';

describe('ID Generator Utility - Unit Tests', () => {
  it('should generate properly formatted company codes', () => {
    const code = generateCompanyCode('Tech Innovations Corp', 1);
    expect(code).toMatch(/^[A-Z0-9]+-2026-\d{4}$/);
  });

  it('should generate properly formatted employee codes', () => {
    const code = generateEmployeeCode('MIND', 42);
    expect(code).toBe('MIND-EMP-0042');
  });

  it('should generate properly formatted branch codes', () => {
    const code = generateBranchCode('MIND', 5);
    expect(code).toBe('MIND-BR-0005');
  });
});
