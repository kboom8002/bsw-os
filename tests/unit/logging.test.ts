import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logAuditMutation, logExceptionError } from '../../lib/logging';

describe('BSW-OS Structured Logging Tests (TDD-05)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully format and output audit mutation logs to console', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const auditEvent = {
      workspaceId: 'ws-123',
      actorId: 'user-owner',
      actionType: 'APPROVE_PATCH',
      targetEntity: 'patch_tickets',
      targetId: 'patch-uuid',
      timestamp: '2026-05-23T20:00:00.000Z',
      metadata: { debug: true }
    };

    const payload = logAuditMutation(auditEvent);

    expect(payload.level).toBe('AUDIT');
    expect(payload.workspaceId).toBe('ws-123');
    expect(payload.message).toContain('Actor "user-owner" executed mutation "APPROVE_PATCH"');
    expect(payload.metadata.debug).toBe(true);

    expect(logSpy).toHaveBeenCalled();
    const loggedString = logSpy.mock.calls[0][0];
    expect(JSON.parse(loggedString)).toEqual(payload);
  });

  it('should successfully format and output exceptions to console.error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorObj = new Error('Database connection timed out');
    errorObj.name = 'TimeoutError';

    const payload = logExceptionError('ws-123', errorObj, 'SupabaseConnector', 'run-99');

    expect(payload.level).toBe('ERROR');
    expect(payload.workspaceId).toBe('ws-123');
    expect(payload.runId).toBe('run-99');
    expect(payload.exceptionName).toBe('TimeoutError');
    expect(payload.message).toContain('Error in context "SupabaseConnector": Database connection timed out');

    expect(errorSpy).toHaveBeenCalled();
    const errorString = errorSpy.mock.calls[0][0];
    expect(JSON.parse(errorString)).toEqual(payload);
  });
});
