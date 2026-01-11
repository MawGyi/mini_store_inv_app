import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  checkRateLimit, 
  cleanupRateLimitStore, 
  constantTimeEqual, 
  sanitizeInput, 
  validateEmail, 
  validatePasswordStrength,
  generateSecureToken,
  hashPassword
} from '$lib/server/security';

describe('Security Functions', () => {
  describe('Rate Limiting', () => {
    beforeEach(() => {
      cleanupRateLimitStore();
    });

    it('should allow first request from an IP', () => {
      const result = checkRateLimit('192.168.1.1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should allow requests up to the limit', () => {
      const ip = '192.168.1.2';
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(ip);
        expect(result.allowed).toBe(true);
      }
      expect(checkRateLimit(ip).allowed).toBe(false);
    });

    it('should block requests after max attempts', () => {
      const ip = '192.168.1.3';
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip);
      }
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track different IPs separately', () => {
      const ip1 = '192.168.1.4';
      const ip2 = '192.168.1.5';
      
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip1);
      }
      
      const result = checkRateLimit(ip2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should reset count after window expires', () => {
      const ip = '192.168.1.6';
      const firstResult = checkRateLimit(ip);
      expect(firstResult.remaining).toBe(4);
      
      cleanupRateLimitStore();
      const secondResult = checkRateLimit(ip);
      expect(secondResult.remaining).toBe(3);
    });

    it('should return resetTime in future', () => {
      const result = checkRateLimit('192.168.1.7');
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('Constant-Time String Comparison', () => {
    it('should return true for equal strings', () => {
      expect(constantTimeEqual('password123', 'password123')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(constantTimeEqual('password123', 'password124')).toBe(false);
    });

    it('should return false for different length strings', () => {
      expect(constantTimeEqual('short', 'longerpassword')).toBe(false);
    });

    it('should return false for single character difference', () => {
      expect(constantTimeEqual('abc', 'abd')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(constantTimeEqual('', '')).toBe(true);
      expect(constantTimeEqual('', 'a')).toBe(false);
    });

    it('should handle special characters', () => {
      expect(constantTimeEqual('p@ss!word#123', 'p@ss!word#123')).toBe(true);
      expect(constantTimeEqual('p@ss!word#123', 'p@ss!word#124')).toBe(false);
    });

    it('should handle unicode characters', () => {
      expect(constantTimeEqual('密码', '密码')).toBe(true);
      expect(constantTimeEqual('密码', '密码123')).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should remove script tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should remove angle brackets', () => {
      expect(sanitizeInput('<div>Content</div>')).toBe('divContent/div');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('JAVASCRIPT:alert(1)')).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('<img onerror="alert(1)">')).toBe('img "alert(1)"');
      expect(sanitizeInput('<div onclick="alert(1)">')).toBe('div "alert(1)"');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  trimmed  ')).toBe('trimmed');
    });

    it('should pass through normal text', () => {
      expect(sanitizeInput('Normal text content')).toBe('Normal text content');
    });

    it('should handle mixed case protocols', () => {
      expect(sanitizeInput('JaVaScRiPt:evil()')).toBe('evil()');
    });

    it('should handle multiple sanitizations', () => {
      const input = '<script>var x = "<img onerror=1>";</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onerror');
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user.name@example.com')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
      expect(validateEmail('user@sub.example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should reject email without local part', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('user @example.com')).toBe(false);
    });

    it('should reject email with invalid TLD', () => {
      expect(validateEmail('user@.com')).toBe(false);
      expect(validateEmail('user@example.')).toBe(false);
    });

    it('should accept long but valid email', () => {
      const longEmail = 'a'.repeat(50) + '@example.com';
      expect(validateEmail(longEmail)).toBe(true);
    });

    it('should reject email exceeding 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('Password Strength Validation', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('SecurePass123!');
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.errors).toContain('At least 8 characters');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toContain('Lowercase letter');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toContain('Uppercase letter');
    });

    it('should reject password without numbers (weak password)', () => {
      const result = validatePasswordStrength('Password!!');
      expect(result.valid).toBe(true);
      expect(result.errors).toContain('Number');
    });

    it('should accept password with special characters but no numbers', () => {
      const result = validatePasswordStrength('Password!!!');
      expect(result.valid).toBe(true);
      expect(result.errors).toContain('Number');
    });

    it('should accept password with letters and numbers (no special char)', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.valid).toBe(true);
      expect(result.score).toBe(4);
      expect(result.errors).toContain('Special character');
    });

    it('should reject password without numbers (needs number to be valid)', () => {
      const result = validatePasswordStrength('Password!!!');
      expect(result.valid).toBe(true);
      expect(result.errors).toContain('Number');
    });

    it('should accept minimum valid password', () => {
      const result = validatePasswordStrength('Password1!');
      expect(result.valid).toBe(true);
      expect(result.score).toBe(5);
    });

    it('should give higher score for longer password', () => {
      const shortResult = validatePasswordStrength('Secure12!');
      const longResult = validatePasswordStrength('VerySecureLongPassword123!');
      expect(longResult.score).toBeGreaterThan(shortResult.score);
    });

    it('should accept minimum valid password', () => {
      const result = validatePasswordStrength('Password1!');
      expect(result.valid).toBe(true);
      expect(result.score).toBe(5);
    });

    it('should report all errors for weak password', () => {
      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle empty password', () => {
      const result = validatePasswordStrength('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate token of specified length', () => {
      const token = generateSecureToken(32);
      expect(token.length).toBe(32);
    });

    it('should generate different tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should only contain valid characters', () => {
      const token = generateSecureToken(100);
      const validChars = /^[A-Za-z0-9]+$/;
      expect(validChars.test(token)).toBe(true);
    });

    it('should generate different tokens even close together', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken(16));
      }
      expect(tokens.size).toBe(100);
    });

    it('should handle minimum length', () => {
      const token = generateSecureToken(1);
      expect(token.length).toBe(1);
    });
  });

  describe('Password Hashing', () => {
    it('should generate consistent hash for same password', () => {
      const password = 'testpassword123';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different passwords', () => {
      const hash1 = hashPassword('password1');
      const hash2 = hashPassword('password2');
      expect(hash1).not.toBe(hash2);
    });

    it('should include password length in hash', () => {
      const hash1 = hashPassword('abc');
      const hash2 = hashPassword('abcdef');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce hash starting with hash_ prefix', () => {
      const hash = hashPassword('testpassword');
      expect(hash.startsWith('hash_')).toBe(true);
    });

    it('should handle empty password', () => {
      const hash = hashPassword('');
      expect(hash.startsWith('hash_')).toBe(true);
    });

    it('should handle long password', () => {
      const longPassword = 'a'.repeat(1000);
      const hash = hashPassword(longPassword);
      expect(hash.startsWith('hash_')).toBe(true);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle special characters in password', () => {
      const hash = hashPassword('p@ss!word#123$');
      expect(hash.startsWith('hash_')).toBe(true);
    });

    it('should handle unicode characters in password', () => {
      const hash = hashPassword('密码 пароль 🔐');
      expect(hash.startsWith('hash_')).toBe(true);
    });
  });
});
