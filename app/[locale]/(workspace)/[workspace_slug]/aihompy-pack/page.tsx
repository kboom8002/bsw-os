/**
 * app/[locale]/(workspace)/[workspace_slug]/aihompy-pack/page.tsx
 *
 * "use client" AI홈피 Attractor Pack 생성 메인 대시보드
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Store, Sparkles, MapPin, Phone, Clock, FileText, CheckCircle, Info, HelpCircle } from 'lucide-react';
import { resolveWorkspaceSlug } from '../../../../actions/workspace';

export default function AihompyPackPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const workspaceSlug = params.workspace_slug as string;

  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  
  // 네이버 플레이스 동기화 필드
  const [naverUrl, setNaverUrl] = useState('');
  const [syncingNaver, setSyncingNaver] = useState(false);

  // 인테이크 폼 상태
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [industryType, setIndustryType] = useState<'restaurant_cafe' | 'accommodation' | 'experience' | 'wellness_kbeauty' | 'tourism_activity'>('restaurant_cafe');
  
  // 시설 조건 상태 — 기본값 false (동기화 또는 수동 입력 시 true 전환)
  const [parking, setParking] = useState(false);
  const [parkingDetail, setParkingDetail] = useState('');
  const [indoorSeats, setIndoorSeats] = useState(false);
  const [wheelchairAccess, setWheelchairAccess] = useState(false);
  const [kidsMenu, setKidsMenu] = useState(false);
  const [petAllowed, setPetAllowed] = useState(false);
  const [foreignLang, setForeignLang] = useState<string[]>([]);

  // 메뉴 리스트 — 빈 배열 (동기화 또는 수동 추가 시 채움)
  const [menuItems, setMenuItems] = useState<Array<{ name: string; price: number }>>([
  ]);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');

  // 티어 및 결과 상태
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro' | 'premium'>('pro');
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    async function loadWs() {
      try {
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (wsId) setWorkspaceId(wsId);
      } catch (err) {
        console.error('Failed to load workspace', err);
      } finally {
        setLoadingWorkspace(false);
      }
    }
    loadWs();
  }, [workspaceSlug]);

  // 실시간 미리보기 트리거
  const triggerPreview = async () => {
    if (!workspaceId || !businessName) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/aihompy-pack/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          businessData: getPayload()
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
        if (data.recommended_tier) {
          setSelectedTier(data.recommended_tier);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 네이버 플레이스 실 크롤링 동기화
  const handleNaverSync = async () => {
    if (!naverUrl) return;
    setSyncingNaver(true);
    try {
      const res = await fetch('/api/aihompy-pack/naver-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naverUrl }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        if (d.business_name) setBusinessName(d.business_name);
        if (d.address) setAddress(d.address);
        if (d.phone) setPhone(d.phone);
        if (d.business_hours) setHours(d.business_hours);
        if (d.description) setDescription(d.description);
        if (d.industry_type) setIndustryType(d.industry_type);
        if (d.facilities) {
          if (d.facilities.parking !== undefined) setParking(d.facilities.parking);
          if (d.facilities.parking_detail) setParkingDetail(d.facilities.parking_detail);
          if (d.facilities.indoor_seats !== undefined) setIndoorSeats(d.facilities.indoor_seats);
          if (d.facilities.wheelchair_access !== undefined) setWheelchairAccess(d.facilities.wheelchair_access);
          if (d.facilities.kids_menu !== undefined) setKidsMenu(d.facilities.kids_menu);
          if (d.facilities.pet_allowed !== undefined) setPetAllowed(d.facilities.pet_allowed);
          if (d.facilities.foreign_language_menu?.length > 0) setForeignLang(d.facilities.foreign_language_menu);
        }
        alert(`✅ ${json.message || '네이버 플레이스 정보가 연동되었습니다!'}`);
      } else {
        // 실 크롤링 실패 시 ID 파싱 불가 → 안내 메시지
        throw new Error(json.error || '정보를 가져오지 못했습니다.');
      }
    } catch (err: any) {
      // 환경변수 미설정 또는 네트워크 오류 시 친화적 안내
      const msg = err.message || '연동 실패';
      if (msg.includes('유효한 네이버') || msg.includes('ID')) {
        alert('❌ 유효한 네이버 플레이스 URL 또는 ID를 입력해 주세요.\n예: https://map.naver.com/v5/entry/place/1234567890');
      } else {
        alert(`⚠️ 크롤링 중 오류가 발생했습니다. NAVER_CLIENT_ID/SECRET 환경변수가 설정되어 있으면 더 정확한 정보를 가져올 수 있습니다.\n\n오류: ${msg}`);
      }
    } finally {
      setSyncingNaver(false);
    }
  };

  const getPayload = () => ({
    business_name: businessName,
    address,
    phone,
    business_hours: hours,
    description,
    industry_type: industryType,
    facilities: {
      parking,
      parking_detail: parkingDetail,
      indoor_seats: indoorSeats,
      wheelchair_access: wheelchairAccess,
      kids_menu: kidsMenu,
      pet_allowed: petAllowed,
      foreign_language_menu: foreignLang
    },
    menu_items: menuItems,
    photos: [],      // 실 사진 업로드 기능 연동 시 교체
    faq_entries: []  // AI가 시설 정보 기반으로 자동 생성
  });

  // 최종 생성 파이프라인 호출
  const handleGenerate = async () => {
    if (!businessName || !workspaceId) {
      alert('업체 이름을 입력해 주세요.');
      return;
    }
    // ❌6 블로커 제거: 이전 세션 결과가 간섭하지 않도록 클리어
    sessionStorage.removeItem('aihompy_pack_result');
    sessionStorage.removeItem('aihompy_pack_intake');
    setGenerating(true);
    try {
      const res = await fetch(`/api/aihompy-pack/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          businessData: getPayload(),
          tier: selectedTier
        })
      });
      const result = await res.json();
      if (result.success) {
        // 임시 세션스토리지에 저장하여 결과 페이지로 배달
        sessionStorage.setItem('aihompy_pack_result', JSON.stringify(result));
        sessionStorage.setItem('aihompy_pack_intake', JSON.stringify(getPayload()));
        router.push(`/${locale}/${workspaceSlug}/aihompy-pack/result`);
      } else {
        alert(result.error || '생성 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 생성 파이프라인 처리 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddMenu = () => {
    if (!newMenuName || !newMenuPrice) return;
    setMenuItems([...menuItems, { name: newMenuName, price: parseInt(newMenuPrice) }]);
    setNewMenuName('');
    setNewMenuPrice('');
  };

  const handleLangToggle = (lang: string) => {
    if (foreignLang.includes(lang)) {
      setForeignLang(foreignLang.filter(l => l !== lang));
    } else {
      setForeignLang([...foreignLang, lang]);
    }
  };

  if (loadingWorkspace) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090b10] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] px-8 py-10 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <Store className="h-8 w-8 text-indigo-400" />
            AI홈피 Attractor Pack 빌더
          </h1>
          <p className="mt-2 text-sm text-[#94a3b8] max-w-2xl">
            소상공인의 업체 정보를 활용하여 상황별(우천, 동반자, 접근성 등) 최적화 추천에 노출되는 고기능성 AI 웹사이트 팩을 조립합니다.
          </p>
        </div>
        <button
          onClick={triggerPreview}
          disabled={previewLoading || !businessName}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1e293b] disabled:text-[#64748b] text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {previewLoading ? '맥락 분석 중...' : '매칭 어트랙터 분석'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Section */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 네이버 플레이스 간편 동기화 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg">
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-300">
              <MapPin className="h-5 w-5 text-indigo-400" />
              네이버 플레이스 간편 연동
            </h2>
            <p className="text-xs text-[#64748b] mt-1">네이버 지도 등록된 플레이스 주소 또는 ID를 입력하면 1초 만에 정보를 동기화합니다.</p>
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                value={naverUrl}
                onChange={(e) => setNaverUrl(e.target.value)}
                placeholder="https://map.naver.com/v5/entry/place/12345678"
                className="flex-1 px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleNaverSync}
                disabled={syncingNaver}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-indigo-300 rounded-xl text-sm font-medium transition-all"
              >
                {syncingNaver ? '연동 중...' : '동기화'}
              </button>
            </div>
          </div>

          {/* 기본 정보 폼 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-purple-300">
              <FileText className="h-5 w-5 text-purple-400" />
              업체 기본 정보 입력
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#94a3b8]">업체명 (상호)</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="예: 애월 코지 키친"
                  className="mt-1 w-full px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#94a3b8]">업종 유형</label>
                <select
                  value={industryType}
                  onChange={(e: any) => setIndustryType(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="restaurant_cafe">맛집·카페</option>
                  <option value="accommodation">숙박·호텔</option>
                  <option value="experience">체험·레저</option>
                  <option value="wellness_kbeauty">웰니스·K뷰티</option>
                  <option value="tourism_activity">관광·명소</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#94a3b8]">주소</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="예: 제주시 애월읍 애월로 1"
                  className="mt-1 w-full px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#94a3b8]">전화번호</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="예: 064-123-4567"
                  className="mt-1 w-full px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#94a3b8]">영업 시간</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="예: 매일 09:00 - 21:00 (화요일 휴무)"
                className="mt-1 w-full px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#94a3b8]">상세 소개글 (AEO 텐서 추출의 핵심 소스)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="매장 고유의 강점, 차별화된 가치, 휠체어 여부나 아이 동반 적합성 등을 자유롭게 기록하세요."
                className="mt-1 w-full px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* 상황형 속성 조건 선택 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-pink-300">
              <CheckCircle className="h-5 w-5 text-pink-400" />
              상황형 편의 속성 지정 (FSM 게이트 작동용)
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-3 bg-[#090b10] border border-[#334155] rounded-xl cursor-pointer hover:border-indigo-500 transition-all">
                <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="rounded text-indigo-500 focus:ring-0" />
                <span className="text-sm font-semibold">주차 가능</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-[#090b10] border border-[#334155] rounded-xl cursor-pointer hover:border-indigo-500 transition-all">
                <input type="checkbox" checked={indoorSeats} onChange={(e) => setIndoorSeats(e.target.checked)} className="rounded text-indigo-500 focus:ring-0" />
                <span className="text-sm font-semibold">실내 좌석 완비</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-[#090b10] border border-[#334155] rounded-xl cursor-pointer hover:border-indigo-500 transition-all">
                <input type="checkbox" checked={wheelchairAccess} onChange={(e) => setWheelchairAccess(e.target.checked)} className="rounded text-indigo-500 focus:ring-0" />
                <span className="text-sm font-semibold">배리어 프리 (문턱 없음)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-[#090b10] border border-[#334155] rounded-xl cursor-pointer hover:border-indigo-500 transition-all">
                <input type="checkbox" checked={kidsMenu} onChange={(e) => setKidsMenu(e.target.checked)} className="rounded text-indigo-500 focus:ring-0" />
                <span className="text-sm font-semibold">아기 의자/키즈 프렌들리</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-[#090b10] border border-[#334155] rounded-xl cursor-pointer hover:border-indigo-500 transition-all">
                <input type="checkbox" checked={petAllowed} onChange={(e) => setPetAllowed(e.target.checked)} className="rounded text-indigo-500 focus:ring-0" />
                <span className="text-sm font-semibold">반려동물 허용</span>
              </label>
            </div>

            {parking && (
              <div>
                <label className="text-xs font-semibold text-[#94a3b8]">주차장 상세 설명</label>
                <input
                  type="text"
                  value={parkingDetail}
                  onChange={(e) => setParkingDetail(e.target.value)}
                  placeholder="예: 매장 앞 전용 무료 주차장 30면 완비 (대형 버스 주차 가능)"
                  className="mt-1 w-full px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-2">지원 외국어 메뉴 (중복 선택 가능)</label>
              <div className="flex gap-2">
                {['en', 'ja', 'zh'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => handleLangToggle(lang)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      foreignLang.includes(lang) 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                        : 'bg-[#090b10] border-[#334155] text-[#94a3b8] hover:border-indigo-500'
                    }`}
                  >
                    {lang === 'en' ? '영어 (English)' : lang === 'ja' ? '일본어 (日本語)' : '중국어 (中文)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 메뉴 입력 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-pink-300">대표 메뉴 구성</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                placeholder="메뉴명"
                className="flex-1 px-4 py-2 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                value={newMenuPrice}
                onChange={(e) => setNewMenuPrice(e.target.value)}
                placeholder="가격 (원)"
                className="w-32 px-4 py-2 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddMenu}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all"
              >
                추가
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {menuItems.map((item, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-[#1e293b] border border-[#334155] rounded-xl text-xs font-semibold flex items-center gap-2">
                  {item.name} ({item.price.toLocaleString()}원)
                  <button onClick={() => setMenuItems(menuItems.filter((_, i) => i !== idx))} className="text-pink-500 font-bold hover:text-pink-400">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="space-y-6">
          
          {/* 상품 선택 티어 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              상품 티어 구성 선택
            </h2>
            
            <div className="space-y-3">
              {[
                { id: 'basic', title: 'Basic - AI검색 기본 노출팩', price: '₩ 29,000 / 월', desc: '상황형 FAQ 5개, AI 소개글, llm.txt 탑재' },
                { id: 'pro', title: 'Pro - Attractor Pack', price: '₩ 59,000 / 월', desc: '상황별 섹션 생성, 6개 채널 솔리톤, FAQ 10개' },
                { id: 'premium', title: 'Premium - Local GEO Pack', price: '₩ 129,000 / 월', desc: '경쟁/갭 분석, 다국어 영문 지원, 7채널 마스터' }
              ].map(tier => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTier === tier.id
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-[#090b10] border-[#334155] hover:border-indigo-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">{tier.title}</span>
                    <span className="text-xs font-semibold text-indigo-400">{tier.price}</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1.5">{tier.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 실시간 매칭 어트랙터 프리뷰 카드 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg">
            <h2 className="text-lg font-bold text-purple-300 flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-purple-400" />
              매칭 어트랙터 분석 결과
            </h2>

            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
                <span className="text-xs text-[#64748b]">구조 파싱 및 텐서 계산 중...</span>
              </div>
            ) : previewData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#090b10] border border-[#334155] rounded-xl">
                  <span className="text-xs font-semibold text-[#94a3b8]">활성화 가능한 패턴</span>
                  <span className="text-sm font-extrabold text-indigo-300">{previewData.applicable_attractors_count}개 발견</span>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {previewData.applicable_attractors?.map((a: any, idx: number) => (
                    <div key={idx} className="p-2 bg-[#090b10]/60 border border-[#1e293b] rounded-lg text-xs flex justify-between items-center">
                      <span className="font-semibold text-white truncate max-w-[150px]">{a.attractor_id}</span>
                      <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded-md font-bold text-[10px]">매칭 {a.fit_score}%</span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-[#64748b] bg-[#090b10] p-2.5 rounded-lg border border-[#1e293b] leading-relaxed">
                  <span className="font-bold text-[#94a3b8] block mb-1">💡 AI 최적 티어 추천</span>
                  {previewData.recommended_tier === 'premium' 
                    ? '매칭되는 상황형 패턴이 많아, 다국어 영문 및 GEO 갭 분석이 지원되는 Premium 요금제를 권장합니다.'
                    : previewData.recommended_tier === 'pro'
                    ? '평균 3개 이상의 핵심 패턴에 부합하여, 6개 채널 동시 출력이 보장되는 Pro 요금제를 제안합니다.'
                    : '기본적인 정보 및 상황형 노출 위주의 Basic 요금제가 최적입니다.'}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-[#64748b] border border-dashed border-[#334155] rounded-xl">
                상호 입력 후 "매칭 어트랙터 분석" 버튼을 누르시면 실시간 활성 패턴을 미리 봅니다.
              </div>
            )}
          </div>

          {/* 최종 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={generating || !businessName}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:from-[#1e293b] disabled:to-[#1e293b] disabled:text-[#64748b] text-white rounded-2xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
          >
            <Sparkles className="h-5 w-5" />
            {generating ? 'AI홈피 조립 및 파이프라인 생성 중...' : 'AI홈피 Attractor Pack 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
