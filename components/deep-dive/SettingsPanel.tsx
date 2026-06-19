'use client';

import React, { useState, useEffect } from 'react';

const Card = ({ children, className = '' }: any) => <div className={`border rounded-xl bg-white shadow-sm overflow-hidden ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: any) => <div className={`px-6 py-4 border-b ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: any) => <h3 className={`text-lg font-bold ${className}`}>{children}</h3>;
const CardDescription = ({ children, className = '' }: any) => <p className={`text-sm text-slate-500 mt-1 ${className}`}>{children}</p>;
const CardContent = ({ children, className = '' }: any) => <div className={`p-6 space-y-4 ${className}`}>{children}</div>;
const Button = ({ children, onClick, disabled, className = '' }: any) => (
  <button onClick={onClick} disabled={disabled} className={`bg-slate-900 text-white hover:bg-slate-800 h-10 px-4 py-2 rounded-md font-medium disabled:opacity-50 ${className}`}>
    {children}
  </button>
);

export function SettingsPanel({ workspaceId }: { workspaceId: string }) {
  const [settings, setSettings] = useState({
    billingModel: 'subscription', // 'subscription' | 'pay_as_you_go'
    llmCostIncluded: true,
    requireApproval: true,
    promptExternalManagementConsent: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/deep-dive/settings?workspace_id=${workspaceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings);
        }
        setLoading(false);
      });
  }, [workspaceId]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch('/api/deep-dive/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, settings })
      });
      alert('설정이 저장되었습니다.');
    } catch (e) {
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>설정 로딩 중...</div>;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>클라이언트 정책 및 비용 설정</CardTitle>
        <CardDescription>측정 및 리포트 제공에 적용되는 과금 및 운영 정책을 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 1. 월구독 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">1. 결제 모델</label>
          <select 
            value={settings.billingModel} 
            onChange={(e) => setSettings({ ...settings, billingModel: e.target.value })}
            className="w-full border p-2 rounded-md"
          >
            <option value="subscription">월구독 (Monthly Subscription)</option>
            <option value="pay_as_you_go">건별 과금 (Pay-as-you-go)</option>
          </select>
        </div>

        {/* 2. 포함 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">2. LLM API 비용 정책</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input 
                type="radio" 
                name="llmCost" 
                checked={settings.llmCostIncluded} 
                onChange={() => setSettings({ ...settings, llmCostIncluded: true })} 
              />
              <span>월구독에 포함</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                type="radio" 
                name="llmCost" 
                checked={!settings.llmCostIncluded} 
                onChange={() => setSettings({ ...settings, llmCostIncluded: false })} 
              />
              <span>별도 청구</span>
            </label>
          </div>
        </div>

        {/* 3. 동의 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">3. 프롬프트 외부 관리 동의</label>
          <p className="text-sm text-slate-500 mb-2">당사의 최적화된 프롬프트를 사용하여 벤치마크를 수행하는 것에 동의합니다.</p>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={settings.promptExternalManagementConsent} 
              onChange={(e) => setSettings({ ...settings, promptExternalManagementConsent: e.target.checked })} 
            />
            <span>동의함</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">4. 2차 승인 프로세스 적용</label>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={settings.requireApproval} 
              onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })} 
            />
            <span>결과 배포 전 수동 승인 필요</span>
          </label>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
