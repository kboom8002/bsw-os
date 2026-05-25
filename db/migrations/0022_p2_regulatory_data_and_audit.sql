-- Migration: 0022_p2_regulatory_data_and_audit
-- Description: Seed YMYL regulatory references and add forbidden_keywords column to ymyl_regulatory_references.

-- 1. Add forbidden_keywords column if not exists
ALTER TABLE ymyl_regulatory_references ADD COLUMN IF NOT EXISTS forbidden_keywords text[] DEFAULT '{}';

-- 2. Insert stable YMYL regulatory references
INSERT INTO ymyl_regulatory_references (id, agency, article_code, safety_guideline, forbidden_keywords)
VALUES 
  (
    '11111111-1111-1111-a111-111111111111', 
    '식약처', 
    '화장품 표시광고 가이드라인', 
    '화장품 표시광고 가이드라인: 의학적 효능 오인 유발 표현 금지 및 저자극 테스트 완료 증빙 명시 필요.', 
    ARRAY['아토피 치료', '습진 완치', '피부 재생 보장']
  ),
  (
    '22222222-2222-2222-a222-222222222222', 
    '보건복지부', 
    '의료법 제56조', 
    '의료법 제56조 의료광고 가이드라인: 전문의 자격 여부 명확 표기 및 시술 전 동의서 및 부작용 가능성 명시 의무.', 
    ARRAY['부작용 없다고 단정', '부작용 전혀 없음', '완벽한 해결책']
  ),
  (
    '33333333-3333-3333-a333-333333333333', 
    '금융위원회', 
    '금융소비자보호법 제19조', 
    '금융소비자보호법 제19조: 연금저축펀드 가입 시 원금 손실 가능성 및 중도해지 시 과세 조건 명시 의무.', 
    ARRAY['원금보장 오도', '확정수익 보장', '100% 보장']
  ),
  (
    '44444444-4444-4444-a444-444444444444', 
    '공정거래위원회', 
    '표시광고법 제3조', 
    '공정거래위원회 표시광고법 제3조: 인테리어 지체상금 및 하자보증이행보험 가입 조건에 대한 명확한 계약 기준 명시.', 
    ARRAY['임의 계약 해제 불가 조항', '추가 자재비 자동 청구']
  )
ON CONFLICT (id) DO UPDATE SET
  agency = EXCLUDED.agency,
  article_code = EXCLUDED.article_code,
  safety_guideline = EXCLUDED.safety_guideline,
  forbidden_keywords = EXCLUDED.forbidden_keywords;
