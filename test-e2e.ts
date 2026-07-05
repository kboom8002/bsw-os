import { getSupabaseAdminClient } from './lib/supabase';
import { runE2EPipeline } from './app/actions/qis-bridge';

// 1) 강제로 환경 변수 주입 (로컬 테스트용)
process.env.DEMO_MODE = 'true';
process.env.MOCK_AI = 'true';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // 방화벽 이슈 방지

// 로컬 환경변수 파일 수동 파싱 (tsx 직접 실행 시 필요)
import * as fs from 'fs';
import * as path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
  }
} catch (e) {
  console.warn("Could not load .env.local", e);
}

async function run() {
  const supabase = getSupabaseAdminClient();
  let { data: wsData, error: wsError } = await supabase.from('workspaces').select('id').limit(1);
  if (wsError) {
    console.error("Failed to fetch workspaces:", wsError);
    return;
  }
  
  let workspaceId = wsData && wsData.length > 0 ? wsData[0].id : null;
  if (!workspaceId) {
    const { data: newWs, error: insertError } = await supabase.from('workspaces').insert({
      name: 'Jeju Test WS',
      slug: 'jeju-test-ws',
      plan: 'pro'
    }).select().single();
    if (insertError) {
      console.error("Failed to create workspace:", insertError);
      return;
    }
    workspaceId = newWs.id;
  }
  
  console.log("Using Workspace ID:", workspaceId);
  
  try {
    console.log("Running E2E Pipeline for jeju_smb / donsadon...");
    const result = await runE2EPipeline(workspaceId, 'jeju_smb', 'donsadon', {
      industryKey: 'jeju_smb',
      brandUSP: '제주 흑돼지 연탄구이 전문점',
      autoPromoteTopN: 3
    });
    console.log("=== PIPELINE EXECUTION SUCCESS ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("=== PIPELINE EXECUTION ERROR ===");
    console.error(err);
  }
}

run();
