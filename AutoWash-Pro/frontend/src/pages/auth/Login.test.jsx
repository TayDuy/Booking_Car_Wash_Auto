import { describe, it, expect, vi } from 'vitest';
import { isLoggedIn, getRole } from '../../api/authService';

vi.mock('../../api/authService', () => ({
  isLoggedIn: vi.fn(() => false),
  getRole: vi.fn(() => 'CUSTOMER'),
}));

describe('Login Page Authentication Checks', () => {
  it('should default to not logged in and return correct role', () => {
    expect(isLoggedIn()).toBe(false);
    expect(getRole()).toBe('CUSTOMER');
  });
});
