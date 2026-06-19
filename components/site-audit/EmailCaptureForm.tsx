import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function EmailCaptureForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // In a real app, send to API endpoint
    console.log('Captured email:', email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          <div>
            <h4 className="text-emerald-400 font-bold">리포트 발송 예약 완료</h4>
            <p className="text-xs text-slate-400">입력하신 이메일로 진단 결과를 보내드립니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
      <div>
        <h4 className="text-slate-100 font-bold flex items-center gap-2">
          <Mail className="h-4 w-4 text-indigo-400" /> 진단 결과를 보관하시겠습니까?
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          현재 페이지를 닫으시면 추정된 Quick Scan 결과가 사라질 수 있습니다. 
          이메일을 입력하시면 결과를 정리하여 보내드립니다. (무료)
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex w-full md:w-auto gap-2">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="work@company.com" 
          className="flex-1 md:w-64 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          required
        />
        <button 
          type="submit"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          보내기 <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
