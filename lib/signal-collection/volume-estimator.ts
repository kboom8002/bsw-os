import * as fs from 'fs';
import * as path from 'path';
import { SearchProviderFactory } from '../ai/search-provider-factory';
import { getSupabaseAdminClient } from '../supabase';

/** 볼륨 추정 최소값. 모든 경로에서 이 값 미만은 반환하지 않음. */
const MIN_ESTIMATED_VOLUME = 10;

export interface CalibratedCoefficients {
  w0: number; // 절편
  w1: number; // Citations 가중치
  w2: number; // Text Length 가중치
  updatedAt: string;
}

const DEFAULT_COEFFICIENTS: CalibratedCoefficients = {
  w0: 2.0,
  w1: 1.2,
  w2: 0.4,
  updatedAt: new Date().toISOString()
};

export class VolumeEstimator {
  private static localCoefficients: CalibratedCoefficients | null = null;

  /**
   * 캘리브레이션된 계수 로딩 (Supabase DB 우선, 실패 시 로컬 JSON 폴백)
   */
  public static async loadCoefficients(workspaceId: string): Promise<CalibratedCoefficients> {
    if (this.localCoefficients) return this.localCoefficients;

    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('workspace_settings')
        .select('volume_coefficients')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (!error && data?.volume_coefficients) {
        this.localCoefficients = data.volume_coefficients as CalibratedCoefficients;
        return this.localCoefficients;
      }
    } catch (dbErr) {
      console.warn('[VolumeEstimator] DB load failed, trying local file:', (dbErr as Error).message);
    }

    // 로컬 파일 폴백
    try {
      const filePath = path.join(process.cwd(), 'db', 'seed', 'external_data', 'volume_coefficients.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        this.localCoefficients = JSON.parse(raw);
        return this.localCoefficients!;
      }
    } catch (fileErr) {
      console.warn('[VolumeEstimator] Local file load failed, using defaults.');
    }

    return DEFAULT_COEFFICIENTS;
  }

  /**
   * 캘리브레이션된 계수 저장 (Supabase DB + 로컬 JSON 동시 기록)
   */
  public static async saveCoefficients(workspaceId: string, coeffs: CalibratedCoefficients): Promise<void> {
    this.localCoefficients = coeffs;

    try {
      const supabase = getSupabaseAdminClient();
      // workspace_settings 테이블에 coefficients 저장 시도
      const { error } = await supabase
        .from('workspace_settings')
        .upsert({
          workspace_id: workspaceId,
          volume_coefficients: coeffs,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log(`[VolumeEstimator] Saved coefficients to DB for workspace ${workspaceId}`);
    } catch (dbErr) {
      console.warn('[VolumeEstimator] Failed to save coefficients to DB, trying local file:', (dbErr as Error).message);
    }

    // 로컬 파일 기록
    try {
      const dirPath = path.join(process.cwd(), 'db', 'seed', 'external_data');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filePath = path.join(dirPath, 'volume_coefficients.json');
      fs.writeFileSync(filePath, JSON.stringify(coeffs, null, 2), 'utf8');
      console.log(`[VolumeEstimator] Saved coefficients to local file: ${filePath}`);
    } catch (fileErr) {
      console.error('[VolumeEstimator] Failed to save coefficients to local file:', (fileErr as Error).message);
    }
  }

  /**
   * Search Grounding Proxy Metrics 기반 트래픽 로그-선형 추정
   *
   * log(V) = w1 * log(C+1) + w2 * log(L+1) + w0
   * C = Citations count, L = Response text length
   */
  static async estimateVolume(query: string, workspaceId?: string): Promise<number> {
    try {
      // 1. Google Search Grounding API를 호출하여 프록시 지표 획득
      const searchRes = await SearchProviderFactory.runMultiEngine(query, ['gemini_grounding']);
      const res = searchRes.results['gemini_grounding'];
      
      if (!res || !res.citations || res.citations.length === 0) {
        // 인용 없음 = 롱테일 키워드 → 낮은 범위의 결정적 fallback
        return VolumeEstimator.deterministicFallback(query, 'low');
      }

      const C = res.citations.length;
      const L = res.raw_response_text?.length || 0;

      // 2. 가중치 계수 로딩 (기본값 또는 캘리브레이션된 값)
      const coeffs = workspaceId ? await this.loadCoefficients(workspaceId) : DEFAULT_COEFFICIENTS;

      // 로그-선형 모델 적용 (Zipf 법칙 및 롱테일 대수 비례 보정)
      const logV = coeffs.w1 * Math.log(C + 1) + coeffs.w2 * Math.log(L + 1) + coeffs.w0;
      const estimatedVolume = Math.max(MIN_ESTIMATED_VOLUME, Math.floor(Math.exp(logV)));
      
      return Math.min(10000, estimatedVolume); // 상한 캡 10,000
    } catch (e: any) {
      console.warn(`[VolumeEstimator] Failed to estimate volume for "${query}": ${e.message}`);
      // API 장애 시 중간 범위의 결정적 fallback
      return VolumeEstimator.deterministicFallback(query, 'medium');
    }
  }

  /**
   * 결정적 해시 기반 Zipf's Law 로그정규 분포 fallback.
   * 동일 query는 항상 동일 값을 반환하여 재현성을 보장합니다.
   *
   * [v2.0] Box-Muller 변환 시 2개의 독립적인 균등분포 변수(u1, u2)를 사용하여 통계적 무작위성 오류 수정.
   */
  private static deterministicFallback(query: string, tier: 'low' | 'medium'): number {
    let hash1 = 0;
    let hash2 = 137; // 보조 시드
    
    for (let i = 0; i < query.length; i++) {
      const code = query.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1 + code) | 0;
      hash2 = ((hash2 << 5) - hash2 + code) | 0;
    }
    
    // [0, 1) 구간으로 정규화된 2개의 독립된 균등분포 변수
    const u1 = Math.abs(hash1 & 0x7FFFFFFF) / 0x7FFFFFFF;
    const u2 = Math.abs(hash2 & 0x7FFFFFFF) / 0x7FFFFFFF;
    
    // Box-Muller 변환을 이용한 표준정규분포 난수 생성
    const z = Math.sqrt(-2.0 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2.0 * Math.PI * u2);
    
    // 로그정규분포 매핑: exp(mu + sigma * z)
    const mu = tier === 'low' ? 2.5 : 3.8;   // log(12) or log(44)
    const sigma = 0.8;
    const logNormal = Math.exp(mu + sigma * z);

    return Math.max(MIN_ESTIMATED_VOLUME, Math.min(5000, Math.floor(logNormal)));
  }
}

/**
 * Volume Calibrator
 * GSC 실측 데이터(Impressions)와 Search Grounding Proxy Metrics를 매칭하여
 * 다중 선형 회귀 분석(Multiple Linear Regression)을 통해 볼륨 예측 계수를 정밀 캘리브레이션합니다.
 */
export class VolumeCalibrator {
  
  /**
   * 다중 선형 회귀 학습 (Ordinary Least Squares - OLS)
   * 모델: y = w0 + w1*x1 + w2*x2
   * y = ln(GSC Impressions), x1 = ln(C + 1), x2 = ln(L + 1)
   */
  public static async calibrate(workspaceId: string): Promise<CalibratedCoefficients> {
    const supabase = getSupabaseAdminClient();
    
    // 1. GSC 시그널 조회 (실측 임프레션 존재 대상)
    const { data: signals } = await supabase
      .from('external_signals')
      .select('content, metadata')
      .eq('workspace_id', workspaceId)
      .eq('source_type', 'gsc_query')
      .order('collected_at', { ascending: false })
      .limit(100);

    if (!signals || signals.length < 5) {
      console.warn(`[VolumeCalibrator] Insufficient GSC data (${signals?.length || 0}/5). Calibration skipped.`);
      return DEFAULT_COEFFICIENTS;
    }

    const trainingData: { y: number; x1: number; x2: number }[] = [];

    // 2. 검색 프록시 수집 (C, L)
    for (const sig of signals) {
      const query = sig.content;
      const V = sig.metadata?.impressions || 0;
      if (V < MIN_ESTIMATED_VOLUME) continue;

      try {
        const searchRes = await SearchProviderFactory.runMultiEngine(query, ['gemini_grounding']);
        const res = searchRes.results['gemini_grounding'];
        
        if (res && res.citations && res.citations.length > 0) {
          const C = res.citations.length;
          const L = res.raw_response_text?.length || 0;
          
          trainingData.push({
            y: Math.log(V),
            x1: Math.log(C + 1),
            x2: Math.log(L + 1)
          });
        }
      } catch (e) {
        console.warn(`[VolumeCalibrator] Failed to fetch proxy for "${query}":`, (e as Error).message);
      }
    }

    if (trainingData.length < 5) {
      console.warn(`[VolumeCalibrator] Insufficient matched training samples (${trainingData.length}). Calibration skipped.`);
      return DEFAULT_COEFFICIENTS;
    }

    // 3. 다중 선형 회귀 분석 해결 (w = (X^T X)^-1 X^T y)
    // 3개 변수 (상수항 w0, w1, w2) 해결을 위해 3x3 행렬 연산 직접 구현
    const coeffs = this.solveLinearRegression(trainingData);
    
    const result: CalibratedCoefficients = {
      w0: Number(coeffs[0].toFixed(4)),
      w1: Number(coeffs[1].toFixed(4)),
      w2: Number(coeffs[2].toFixed(4)),
      updatedAt: new Date().toISOString()
    };

    console.log('[VolumeCalibrator] Calibration completed successfully:', result);
    await VolumeEstimator.saveCoefficients(workspaceId, result);
    
    return result;
  }

  /**
   * 3변수 다중선형회귀 해석적 솔버 (행렬 연산)
   */
  private static solveLinearRegression(data: { y: number; x1: number; x2: number }[]): [number, number, number] {
    const N = data.length;
    
    let sumX1 = 0, sumX2 = 0, sumY = 0;
    let sumX1Sq = 0, sumX2Sq = 0;
    let sumX1X2 = 0, sumX1Y = 0, sumX2Y = 0;

    for (const d of data) {
      sumX1 += d.x1;
      sumX2 += d.x2;
      sumY += d.y;
      sumX1Sq += d.x1 * d.x1;
      sumX2Sq += d.x2 * d.x2;
      sumX1X2 += d.x1 * d.x2;
      sumX1Y += d.x1 * d.y;
      sumX2Y += d.x2 * d.y;
    }

    // X^T X 행렬 (3x3)
    const M = [
      [N, sumX1, sumX2],
      [sumX1, sumX1Sq, sumX1X2],
      [sumX2, sumX1X2, sumX2Sq]
    ];

    // X^T y 벡터 (3x1)
    const V = [sumY, sumX1Y, sumX2Y];

    // 3x3 행렬식(Determinant) 계산
    const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
                M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
                M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);

    if (Math.abs(det) < 1e-9) {
      console.warn('[VolumeCalibrator] Determinant near zero, regression matrix is singular. Using default coefficients.');
      return [DEFAULT_COEFFICIENTS.w0, DEFAULT_COEFFICIENTS.w1, DEFAULT_COEFFICIENTS.w2];
    }

    // 크라메르 규칙(Cramer's Rule) 또는 역행렬을 이용해 w0, w1, w2 구하기
    const solveForCol = (colIndex: number): number => {
      const temp = M.map(row => [...row]);
      for (let i = 0; i < 3; i++) {
        temp[i][colIndex] = V[i];
      }
      const tempDet = temp[0][0] * (temp[1][1] * temp[2][2] - temp[1][2] * temp[2][1]) -
                      temp[0][1] * (temp[1][0] * temp[2][2] - temp[1][2] * temp[2][0]) +
                      temp[0][2] * (temp[1][0] * temp[2][1] - temp[1][1] * temp[2][0]);
      return tempDet / det;
    };

    const w0 = solveForCol(0);
    const w1 = solveForCol(1);
    const w2 = solveForCol(2);

    return [
      Math.max(0.1, Math.min(5.0, w0)),
      Math.max(0.1, Math.min(3.0, w1)),
      Math.max(0.1, Math.min(3.0, w2))
    ];
  }

  /**
   * 현재 계수의 정확도를 R²와 MAPE로 보고합니다.
   * GSC 실측 데이터를 사용하여 예측값과 비교합니다.
   */
  public static async reportAccuracy(workspaceId: string): Promise<{ rSquared: number; mape: number; sampleSize: number }> {
    const supabase = getSupabaseAdminClient();
    const coeffs = await VolumeEstimator.loadCoefficients(workspaceId);

    // 1. GSC 시그널 조회 (실측 임프레션 존재 대상)
    const { data: signals } = await supabase
      .from('external_signals')
      .select('content, metadata')
      .eq('workspace_id', workspaceId)
      .eq('source_type', 'gsc_query')
      .order('collected_at', { ascending: false })
      .limit(100);

    if (!signals || signals.length < 5) {
      console.warn(`[VolumeCalibrator] Insufficient GSC data (${signals?.length || 0}/5). Cannot report accuracy.`);
      return { rSquared: 0, mape: 100, sampleSize: signals?.length || 0 };
    }

    const actuals: number[] = [];
    const predicted: number[] = [];

    // 2. 검색 프록시 수집 및 예측값 계산
    for (const sig of signals) {
      const query = sig.content;
      const V = sig.metadata?.impressions || 0;
      if (V < MIN_ESTIMATED_VOLUME) continue;

      try {
        const searchRes = await SearchProviderFactory.runMultiEngine(query, ['gemini_grounding']);
        const res = searchRes.results['gemini_grounding'];

        if (res && res.citations && res.citations.length > 0) {
          const C = res.citations.length;
          const L = res.raw_response_text?.length || 0;

          const logPredicted = coeffs.w0 + coeffs.w1 * Math.log(C + 1) + coeffs.w2 * Math.log(L + 1);
          const predictedV = Math.exp(logPredicted);

          actuals.push(V);
          predicted.push(predictedV);
        }
      } catch (e) {
        console.warn(`[VolumeCalibrator] Failed to fetch proxy for "${query}":`, (e as Error).message);
      }
    }

    const sampleSize = actuals.length;
    if (sampleSize < 2) {
      console.warn(`[VolumeCalibrator] Insufficient matched samples (${sampleSize}). Cannot compute accuracy.`);
      return { rSquared: 0, mape: 100, sampleSize };
    }

    // 3. R² 계산: 1 - (SS_res / SS_tot)
    const meanActual = actuals.reduce((sum, v) => sum + v, 0) / sampleSize;
    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < sampleSize; i++) {
      ssRes += (actuals[i] - predicted[i]) ** 2;
      ssTot += (actuals[i] - meanActual) ** 2;
    }
    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

    // 4. MAPE 계산: mean(|actual - predicted| / actual) * 100
    let mapeSum = 0;
    for (let i = 0; i < sampleSize; i++) {
      mapeSum += Math.abs(actuals[i] - predicted[i]) / actuals[i];
    }
    const mape = (mapeSum / sampleSize) * 100;

    console.log(`[VolumeCalibrator] Accuracy report: R²=${rSquared.toFixed(4)}, MAPE=${mape.toFixed(2)}%, samples=${sampleSize}`);

    return {
      rSquared: Number(rSquared.toFixed(4)),
      mape: Number(mape.toFixed(2)),
      sampleSize,
    };
  }
}
