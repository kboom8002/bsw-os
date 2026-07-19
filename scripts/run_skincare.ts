import { DROMigrationPipeline } from '../lib/answer-supply/dro-migration';

async function runTest() {
  console.log("Starting Skincare Pipeline Test...");
  const pipeline = new DROMigrationPipeline();
  
  const legacyRecords = [
    {
      id: 'legacy-q-01',
      question: '레티놀 크림 바르고 얼굴이 빨개졌어요. 홍길동 작성. 연락처: 010-1234-5678',
      answer: '레티놀 화장품 사용 시 일시적인 현상일 수 있으나 증상이 심하면 사용을 중지하세요. 피부 장벽 재생 및 진정 목적의 크림입니다.',
      riskLevel: 'medium'
    }
  ];

  try {
    const result = await pipeline.migrate('skincare-test-workspace', 'skincare', legacyRecords);
    
    console.log("Migration Result:", JSON.stringify({
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed
    }, null, 2));

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log("\n[Generated Asset Spec]");
      console.log(`Title: ${asset.title}`);
      console.log(`Direct Answer: ${asset.directAnswer}`);
      console.log("\nVariations:");
      asset.variations.forEach((v: any) => {
        console.log(`- [${v.channel}]: ${v.title}`);
        console.log(`  Body: ${v.body}`);
      });
      console.log("\nSEO:", asset.seo);
      console.log("\nNext Actions:", asset.nextActions);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Pipeline test failed:", err);
    process.exit(1);
  }
}

runTest();
