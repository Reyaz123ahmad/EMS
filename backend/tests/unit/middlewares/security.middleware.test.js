import { sanitizeInput } from '../../../src/middlewares/security.middleware.js';

describe('Security Middleware - Input Sanitization Unit Tests', () => {
  it('should strip malicious script tags and javascript: urls from request body', () => {
    const req = {
      body: {
        title: 'Safe Title <script>alert("hack")</script>',
        url: 'javascript:alert(1)',
        nested: {
          comment: 'Normal text <script>fetch("evil.com")</script>',
        },
      },
    };
    const res = {};
    const next = () => {};

    sanitizeInput(req, res, next);

    expect(req.body.title).toBe('Safe Title ');
    expect(req.body.url).toBe('alert(1)');
    expect(req.body.nested.comment).toBe('Normal text ');
  });
});
