import { calculateGST } from '../../../src/services/tax.service.js';

describe('GST & Tax Service - Unit Tests', () => {
  it('should split GST into CGST (9%) and SGST (9%) for intra-state transactions', () => {
    const tax = calculateGST(10000, 'intra');
    expect(tax.subtotal).toBe(10000);
    expect(tax.cgst).toBe(900);
    expect(tax.sgst).toBe(900);
    expect(tax.igst).toBe(0);
    expect(tax.totalTax).toBe(1800);
    expect(tax.total).toBe(11800);
  });

  it('should apply IGST (18%) for inter-state transactions', () => {
    const tax = calculateGST(10000, 'inter');
    expect(tax.subtotal).toBe(10000);
    expect(tax.cgst).toBe(0);
    expect(tax.sgst).toBe(0);
    expect(tax.igst).toBe(1800);
    expect(tax.totalTax).toBe(1800);
    expect(tax.total).toBe(11800);
  });
});
