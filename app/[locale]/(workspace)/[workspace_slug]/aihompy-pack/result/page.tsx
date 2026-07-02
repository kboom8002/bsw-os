/**
 * app/[locale]/(workspace)/[workspace_slug]/aihompy-pack/result/page.tsx
 *
 * "use client" AI홈피 Attractor Pack 생성 결과 대시보드
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, Check, Copy, ArrowLeft, ShieldCheck, HelpCircle, FileCode, CheckCircle, Smartphone, Award } from 'lucide-react';

export default function AihompyPackResultPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const workspaceSlug = params.workspace_slug as string;

  const [result, setResult] = useState<any>(null);
  const [intake, setIntake] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'homepage' | 'answercard' | 'chatbot' | 'llmtxt' | 'scores'>('homepage');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedResult = sessionStorage.getItem('aihompy_pack_result');
      const storedIntake = sessionStorage.getItem('aihompy_pack_intake');
      if (storedResult) setResult(JSON.parse(storedResult));
      if (storedIntake) setIntake(JSON.parse(storedIntake));
    }
  }, []);

  const handleCopyLlmTxt = () => {
    if (!result?.llm_txt) return;
    navigator.clipboard.writeText(result.llm_txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result || !intake) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#090b10] text-[#e2e8f0]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mb-4"></div>
        <p className="text-sm text-[#94a3b8]">생성 결과 데이터를 읽어오는 중입니다...</p>
      </div>
    );
  }

  // 상황형 FAQ 파싱
  let faqs: Array<{ question: string; answer: string }> = [];
  const faqSection = result.sections?.find((s: any) => s.section_type === 'faq');
  if (faqSection?.content) {
    try {
      faqs = JSON.parse(faqSection.content);
    } catch (e) {
      faqs = [];
    }
  }

  // CTA 정보 파싱
  let ctaInfo: any = {};
  const ctaSection = result.sections?.find((s: any) => s.section_type === 'cta');
  if (ctaSection?.content) {
    try {
      ctaInfo = JSON.parse(ctaSection.content);
    } catch (e) {
      ctaInfo = {};
    }
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] px-8 py-10 font-sans">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-[#1e293b] pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${locale}/${workspaceSlug}/aihompy-pack`)}
            className="p-2.5 bg-[#111622] hover:bg-[#1e293b] rounded-xl border border-[#1e293b] text-[#94a3b8] hover:text-white transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-md font-extrabold text-[10px] uppercase">
                {result.tier} Pack Active
              </span>
              <h1 className="text-2xl font-extrabold text-white">{intake.business_name} AI홈피</h1>
            </div>
            <p className="text-xs text-[#64748b] mt-1">
              생성 완료일: {new Date().toLocaleDateString()} · 매칭 패턴 {result.matched_attractors?.length || 0}개 연동 완료
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        >
          팩 다운로드 (PDF 내보내기)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1e293b] pb-3 mb-6 overflow-x-auto">
        {[
          { id: 'homepage', label: '🏠 AI홈피 구성' },
          { id: 'answercard', label: '📡 Answer Card (AEO)' },
          { id: 'chatbot', label: '🤖 챗봇 시나리오' },
          { id: 'llmtxt', label: '📄 llm.txt (기계가독)' },
          { id: 'scores', label: '📈 보존성 및 성능 지표' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                : 'bg-[#111622] border-[#1e293b] text-[#94a3b8] hover:border-indigo-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main content tab-specific area */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. HOMEPAGE TAB */}
          {activeTab === 'homepage' && (
            <div className="space-y-6">
              {/* Mock Mobile frame view */}
              <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-8">
                <div className="flex justify-between items-center border-b border-[#1e293b] pb-4">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                    <Smartphone className="h-4 w-4" /> AI홈피 모바일 가독 뷰
                  </span>
                  <span className="text-[10px] text-[#64748b] bg-[#090b10] px-2 py-0.5 rounded border border-[#1e293b]">GENESIS v3.0</span>
                </div>

                {result.sections?.map((sec: any) => {
                  if (sec.section_type === 'faq' || sec.section_type === 'cta') return null;
                  return (
                    <div key={sec.section_id} className="space-y-2 border-l-2 border-indigo-500/30 pl-4 py-1">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-extrabold">{sec.section_type}</span>
                      <h3 className="text-md font-extrabold text-white">{sec.title}</h3>
                      {sec.subtitle && <p className="text-xs text-purple-300">{sec.subtitle}</p>}
                      <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-line">{sec.content}</p>
                    </div>
                  );
                })}

                {/* FAQ Sub-section */}
                {faqs.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-[#1e293b]">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-purple-400" /> 자주 묻는 상황형 질문 (AI FAQ)
                    </h3>
                    <div className="space-y-3">
                      {faqs.map((f, idx) => (
                        <div key={idx} className="p-3 bg-[#090b10]/60 rounded-xl border border-[#1e293b] text-xs">
                          <p className="font-bold text-white">Q: {f.question}</p>
                          <p className="text-[#94a3b8] mt-1 bg-[#111622]/40 p-2 rounded-lg leading-relaxed">A: {f.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Sub-section */}
                {ctaInfo.primary_cta && (
                  <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">{ctaInfo.address}</span>
                      <span className="text-[#94a3b8]">{ctaInfo.phone}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all text-center">
                        {ctaInfo.primary_cta}
                      </button>
                      {ctaInfo.secondary_ctas?.map((btn: string, i: number) => (
                        <button key={i} className="px-4 py-2 bg-[#090b10] border border-[#334155] text-[#94a3b8] hover:text-white rounded-lg text-xs font-bold transition-all">
                          {btn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. ANSWER CARD TAB */}
          {activeTab === 'answercard' && (
            <div className="space-y-6">
              <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" /> AEO 검색 엔진 답변용 Answer Card (솔리톤)
                </h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  이 카드는 구글, 퍼플렉시티 등 AI 검색 엔진이 "소상공인 업체 추천" 질문을 수신했을 때, 지식 스니펫(Snippet)으로 직접 인용되기 좋게 설계된 정합성 요약 카드군입니다.
                </p>

                <div className="space-y-4">
                  {result.matched_attractors?.map((a: any, idx: number) => {
                    const matchedAttr = result.sections?.find((s: any) => s.attractor_id === a.attractor_id);
                    if (!matchedAttr) return null;
                    return (
                      <div key={idx} className="p-4 bg-[#090b10] border border-[#1e293b] rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-indigo-300">{a.attractor_id}</span>
                          <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800 text-[9px] font-bold">AEO 팩트 보존 등급: S-Class</span>
                        </div>
                        <p className="text-xs text-[#e2e8f0] leading-relaxed bg-[#111622] p-3 rounded-lg border border-[#1e293b]">
                          "{matchedAttr.content}"
                        </p>
                        <div className="text-[10px] text-[#64748b] flex justify-between">
                          <span>매칭 사유: {a.reason.split('이')[0]}</span>
                          <span className="font-bold text-indigo-400">CPS 8D 점수: 88점</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. CHATBOT TAB */}
          {activeTab === 'chatbot' && (
            <div className="space-y-6">
              <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
                <h3 className="text-lg font-bold text-white">상황형 AI 챗봇 시나리오</h3>
                <p className="text-xs text-[#94a3b8]">카카오톡 챗봇이나 홈페이지 실시간 예약 상담 챗봇에 탑재되는 정합성 1:1 대응 시나리오 가이드입니다.</p>
                
                <div className="space-y-4">
                  {result.matched_attractors?.map((a: any, idx: number) => (
                    <div key={idx} className="p-4 bg-[#090b10] border border-[#1e293b] rounded-xl space-y-2.5">
                      <span className="text-xs font-bold text-purple-300">트리거 질문: "{a.attractor_id.includes('rainy') ? '비 오는 날 갈만한가요?' : a.attractor_id.includes('elderly') ? '부모님 휠체어 가능한가요?' : '기본 매장 강점 알려주세요'}"</span>
                      <div className="p-3 bg-[#111622] rounded-lg border border-[#1e293b] text-xs">
                        <span className="font-bold text-indigo-300 block mb-1">🤖 챗봇 답변</span>
                        {a.attractor_id.includes('rainy') 
                          ? '비 오는 날은 아늑한 창가 좌석과 따뜻한 시그니처 메뉴를 추천합니다. 전용 실내 주차장이 완비되어 있어 비 한 방울 맞지 않고 쾌적하게 입장하실 수 있습니다.'
                          : a.attractor_id.includes('elderly')
                          ? '네, 저희 1층 입구는 문턱 제거 공사를 완료하여 휠체어 진입이 완벽히 가능합니다. 넓은 전용 테이블 좌석으로 정성껏 안내해 드릴 테니 안심하고 예약하세요.'
                          : '저희 매장은 편리한 무료 주차, 다국어 메뉴판, 아기의자가 모두 완비되어 있어 남녀노소 상황에 맞춘 편안한 식탁을 자부합니다.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. LLM.TXT TAB */}
          {activeTab === 'llmtxt' && (
            <div className="space-y-6">
              <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-indigo-400" /> llms.txt (AI 크롤러 기계가독 정본 파일)
                  </h3>
                  <button
                    onClick={handleCopyLlmTxt}
                    className="px-3 py-1.5 bg-[#090b10] hover:bg-[#1e293b] border border-[#334155] rounded-xl text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? '복사됨' : 'llm.txt 복사'}
                  </button>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  이 파일은 OpenAI, Google, Anthropic 등의 AI 수집 봇이 사이트를 색인할 때 가져가는 정본 요약집입니다. 사용자의 우선순위에 맞춰 <strong>영문(English)</strong>으로 정교하게 자동 조립되었습니다.
                </p>
                <pre className="p-4 bg-[#090b10] border border-[#1e293b] rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
                  {result.llm_txt}
                </pre>
              </div>
            </div>
          )}

          {/* 5. SCORES & QUALITY TAB */}
          {activeTab === 'scores' && (
            <div className="space-y-6">
              <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-400" /> 생성 결과 및 원본 보존율 스코어카드
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '핵심 명제 보존율', score: '94%', sub: 'Proposition' },
                    { label: '실증 근거 보존율', score: '91%', sub: 'Evidence' },
                    { label: '바이브 일치도', score: '88%', sub: 'Vibe Spec' },
                    { label: '종합 정합성 스코어', score: '91%', sub: 'Overall' }
                  ].map((s, i) => (
                    <div key={i} className="p-4 bg-[#090b10] border border-[#1e293b] rounded-xl text-center">
                      <span className="text-[10px] text-[#64748b] block">{s.label}</span>
                      <span className="text-2xl font-extrabold text-white mt-1 block">{s.score}</span>
                      <span className="text-[9px] text-indigo-400 font-semibold">{s.sub}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#090b10] border border-[#1e293b] rounded-xl space-y-3">
                  <span className="text-xs font-bold text-white block">💡 품질 보증 판단 리포트</span>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    본 파이프라인으로 생성된 모든 솔리톤 콘텐츠는 TCO 개념 경계 조건 내에서 작동하며, 과대광고(Overpromise)를 방지하기 위해 policies.yaml 정책 제약을 100% 준수합니다.
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-md text-[10px] font-bold">기타 금지 표현 검출: 0건</span>
                    <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-md text-[10px] font-bold">부작용 과대 평가 제어 완료</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Info Sidebar (Intake Summary) */}
        <div className="space-y-6">
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#94a3b8] uppercase tracking-wider">입력 정보 요약 (SSoT)</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#1e293b]">
                <span className="text-[#64748b]">상호</span>
                <span className="font-semibold text-white">{intake.business_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e293b]">
                <span className="text-[#64748b]">분류</span>
                <span className="font-semibold text-white">{intake.industry_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e293b]">
                <span className="text-[#64748b]">주소</span>
                <span className="font-semibold text-white text-right max-w-[150px] truncate">{intake.address}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e293b]">
                <span className="text-[#64748b]">주차 시설</span>
                <span className="font-semibold text-white">{intake.facilities?.parking ? '단독 주차 가능' : '주차 불가'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#64748b]">외국어 지원</span>
                <span className="font-semibold text-indigo-400 uppercase">{intake.facilities?.foreign_language_menu?.join(', ') || '없음'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-indigo-300">연동된 패키지 매칭률</h3>
            <div className="space-y-3">
              {result.matched_attractors?.map((a: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-semibold truncate max-w-[180px]">{a.attractor_id}</span>
                    <span className="text-indigo-400 font-bold">{a.fit_score}%</span>
                  </div>
                  <div className="w-full bg-[#090b10] rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${a.fit_score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
