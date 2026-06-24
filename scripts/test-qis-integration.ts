import { QisHubClient } from '../lib/qis/hub-client';
import { qisPredictedQuestionSchema } from '../lib/qis-shared-schemas';

async function run() {
  console.log('Testing QIS Hub Client initialization...');
  const client = new QisHubClient();
  
  console.log('Validating QisPredictedQuestion schema...');
  const mockQuestion = {
    bsw_question_id: '123e4567-e89b-12d3-a456-426614174000',
    question_text: '웨딩홀 계약금 환불 되나요?',
    predicted_intent: 'informational',
    predicted_volume: 'high',
    confidence: 0.85,
    first_mover_window_days: 30,
    current_ai_coverage: 'sparse',
    auto_must_include: ['소비자보호법 기준'],
    auto_must_not_do: ['단정적 환불 불가 표현']
  };

  const parsed = qisPredictedQuestionSchema.safeParse(mockQuestion);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error);
    process.exit(1);
  }
  
  console.log('Schema is valid. Hub client is ready to use.');
  console.log('To fully test, run BSW Next.js app and call the Inbound APIs with valid X-QIS-Api-Key.');
}

run().catch(console.error);
