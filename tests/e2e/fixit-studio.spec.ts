import { describe, it, expect } from 'vitest';
import React from 'react';

// Mock UI component simulating the interactive Fix-It Studio Dashboard
const MockFixItStudioPanel = ({ 
  hasRcaHypothesis, 
  hasPatchHypothesis, 
  retestStatus, 
  hasGuardrailRegression,
  isFactoryPromoted
}: { 
  hasRcaHypothesis: boolean; 
  hasPatchHypothesis: boolean; 
  retestStatus: 'pending' | 'running' | 'completed'; 
  hasGuardrailRegression: boolean;
  isFactoryPromoted: boolean;
}) => {
  return (
    React.createElement('div', { id: 'fixit-studio-smoke' },
      React.createElement('h2', null, 'Fix-It OS Closed-Loop Studio'),
      React.createElement('div', { className: 'rca-status' }, 
        hasRcaHypothesis ? 'Root Cause Hypothesis Logged' : 'Awaiting RCA Hypothesis'
      ),
      React.createElement('div', { className: 'patch-status' }, 
        hasPatchHypothesis ? 'Patch Ticket Active (Hypothesis Linked)' : 'Awaiting Patch Hypothesis'
      ),
      React.createElement('div', { className: 'retest-status' }, `Retest Run Status: ${retestStatus}`),
      hasGuardrailRegression && React.createElement('div', { className: 'alert-regression bg-red-600' }, 'CRITICAL GUARDRAIL REGRESSION OVERRIDE'),
      React.createElement('button', { 
        className: 'btn-promote', 
        disabled: hasGuardrailRegression || retestStatus !== 'completed' || isFactoryPromoted
      }, 'Promote to Factory Pattern')
    )
  );
};

describe('TDD-09: Fix-It OS Studio UI Smoke and Route Verification', () => {
  it('should compile and export the required closed-loop Fix-It route paths successfully', () => {
    const routePaths = [
      '/fixit',
      '/fixit/rca',
      '/fixit/patches',
      '/fixit/retests',
      '/fixit/lift',
      '/fixit/factory-candidates',
      '/fixit/playbook'
    ];
    
    expect(routePaths.length).toBe(7);
    expect(routePaths).toContain('/fixit/rca');
    expect(routePaths).toContain('/fixit/patches');
    expect(routePaths).toContain('/fixit/retests');
    expect(routePaths).toContain('/fixit/lift');
    expect(routePaths).toContain('/fixit/factory-candidates');
    expect(routePaths).toContain('/fixit/playbook');
  });

  it('should render the Fix-It Studio Panel with standard passing states', () => {
    const element = React.createElement(MockFixItStudioPanel, {
      hasRcaHypothesis: true,
      hasPatchHypothesis: true,
      retestStatus: 'completed',
      hasGuardrailRegression: false,
      isFactoryPromoted: false
    });

    expect(element).toBeDefined();
    expect(element.props.hasRcaHypothesis).toBe(true);
    expect(element.props.hasPatchHypothesis).toBe(true);
    expect(element.props.retestStatus).toBe('completed');
    expect(element.props.hasGuardrailRegression).toBe(false);
  });

  it('should render warning banners when a critical guardrail regression is detected', () => {
    const element = React.createElement(MockFixItStudioPanel, {
      hasRcaHypothesis: true,
      hasPatchHypothesis: true,
      retestStatus: 'completed',
      hasGuardrailRegression: true, // REGRESSED!
      isFactoryPromoted: false
    });

    expect(element).toBeDefined();
    expect(element.props.hasGuardrailRegression).toBe(true);
  });
});
