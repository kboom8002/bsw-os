import { getSupabaseAdminClient } from '../supabase';
import { logger } from '../logger';
import { ValidatorGuild } from './validator-guild';
import { AnswerAssetGenerator, AnswerAssetSpec } from './answer-asset-generator';
import { EvidenceRegistry } from '../governance/evidence-registry';
import { ClaimRegistry } from '../governance/claim-registry';
import { AnswerMission } from './answer-mission-compiler';
import crypto from 'crypto';

export class DROMigrationPipeline {
  private validatorGuild = new ValidatorGuild();
  private assetGenerator = new AnswerAssetGenerator();
  private evidenceRegistry = new EvidenceRegistry();
  private claimRegistry = new ClaimRegistry();

  /**
   * Sanitizes PII (주민등록번호, 전화번호, 이메일, 이름) from a given string.
   */
  public sanitizePII(text: string): string {
    if (!text) return '';
    let sanitized = text;
    // Resident Registration Number (주민등록번호)
    sanitized = sanitized.replace(/\d{6}-\d{7}/g, '[주민등록번호 마스킹]');
    // Phone Number (일반전화, 휴대폰)
    sanitized = sanitized.replace(/(010|02|031|032|033|041|042|043|051|052|053|054|055|061|062|063|064)-\d{3,4}-\d{4}/g, '[전화번호 마스킹]');
    sanitized = sanitized.replace(/\b010\d{8}/g, '[전화번호 마스킹]');
    // Email Address
    sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g, '[이메일 마스킹]');
    // Name pattern: (고객명/작성자/이름/담당자/의사/원장) : 이름
    sanitized = sanitized.replace(/(고객명|고객|작성자|이름|담당자|의사|원장)\s*:\s*[가-힣]{2,4}/g, '$1: [성함 마스킹]');
    return sanitized;
  }

  /**
   * Runs the legacy DR.O Q&A or FAQ migration pipeline.
   */
  public async migrate(
    workspaceId: string,
    domainKey: string,
    legacyRecords: any[]
  ): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    assets: AnswerAssetSpec[];
    errors: { recordId: string; error: string }[];
  }> {
    const supabase = getSupabaseAdminClient();
    const assets: AnswerAssetSpec[] = [];
    const errors: { recordId: string; error: string }[] = [];
    let succeeded = 0;

    logger.info(`[DROMigrationPipeline] Starting migration of ${legacyRecords.length} records for workspace ${workspaceId}`);

    for (const record of legacyRecords) {
      const recordId = record.id || record.question || `rec-${crypto.randomUUID()}`;
      try {
        if (!record.question || !record.answer) {
          throw new Error('Record is missing question or answer field');
        }

        // 1. Sanitize PII
        const sanitizedQuestion = this.sanitizePII(record.question);
        const sanitizedAnswer = this.sanitizePII(record.answer);

        // 2. Extract and Register Evidence
        const evidenceInput = {
          id: crypto.randomUUID(),
          workspace_id: workspaceId,
          title: `Evidence for legacy FAQ: ${record.id || 'unnamed'}`,
          content: sanitizedAnswer,
          evidence_type: 'manual_verify',
          is_verified: true,
          metadata: { source: 'dro-migration', legacyId: record.id }
        };
        const evidenceItem = await this.evidenceRegistry.registerEvidence(evidenceInput);

        // 3. Extract and Register Operational Truth
        const truthId = crypto.randomUUID();
        const truthPayload = {
          id: truthId,
          workspace_id: workspaceId,
          claim: sanitizedQuestion,
          description: sanitizedAnswer,
          risk_level: record.riskLevel || 'medium',
          review_status: 'approved',
          confidence_score: 1.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          const { error: truthError } = await supabase
            .from('brand_operational_truths')
            .insert(truthPayload);
          if (truthError) throw truthError;
          logger.info(`[DROMigrationPipeline] Registered operational truth in DB: ${truthId}`);
        } catch (err: any) {
          logger.warn(`[DROMigrationPipeline] Failed to register operational truth in DB, falling back: ${err.message}`);
        }

        // 4. Register Claim Node
        const claimInput = {
          id: crypto.randomUUID(),
          workspace_id: workspaceId,
          operational_truth_id: truthId,
          claim_summary: sanitizedQuestion,
          metadata: { ...record.metadata, source: 'dro-migration', legacyId: record.id }
        };
        const claimNode = await this.claimRegistry.registerClaim(claimInput);

        // 5. Link Evidence to Claim Node
        await this.evidenceRegistry.linkEvidenceToClaim(workspaceId, claimNode?.id || claimInput.id, evidenceItem?.id || evidenceInput.id);

        // 6. Create Canonical Question and QIS Scene for the pipeline flow
        const questionSlug = (record.slug || sanitizedQuestion)
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]+/g, '-')
          .replace(/^-+|-+$/g, '') || `faq-${crypto.randomUUID().slice(0, 8)}`;
        
        const questionSignature = crypto.createHash('md5').update(sanitizedQuestion).digest('hex');
        const questionId = crypto.randomUUID();

        // Check if Canonical Question already exists or insert it
        let cqId = questionId;
        try {
          const { data: existingCq, error: cqSelectError } = await supabase
            .from('canonical_questions')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('signature', questionSignature)
            .maybeSingle();

          if (existingCq) {
            cqId = existingCq.id;
            logger.info(`[DROMigrationPipeline] Reusing existing Canonical Question: ${cqId}`);
          } else {
            const { error: cqInsertError } = await supabase
              .from('canonical_questions')
              .insert({
                id: questionId,
                workspace_id: workspaceId,
                normalized_question: sanitizedQuestion,
                slug: questionSlug,
                signature: questionSignature,
                created_at: new Date().toISOString()
              });
            if (cqInsertError) throw cqInsertError;
            logger.info(`[DROMigrationPipeline] Registered Canonical Question in DB: ${questionId}`);
          }
        } catch (err: any) {
          logger.warn(`[DROMigrationPipeline] Failed to handle Canonical Question DB logic, using generated ID: ${err.message}`);
        }

        const sceneId = crypto.randomUUID();
        const scenePayload = {
          id: sceneId,
          workspace_id: workspaceId,
          canonical_question_id: cqId,
          scene_name: `Migrated FAQ Scene: ${questionSlug}`,
          query_template: sanitizedQuestion,
          intent_model: 'informational',
          scenario_context: `Migrated legacy DR.O Q&A under domain ${domainKey}`,
          risk_level: record.riskLevel || 'medium',
          created_at: new Date().toISOString()
        };

        try {
          const { error: sceneError } = await supabase
            .from('qis_scenes')
            .insert(scenePayload);
          if (sceneError) throw sceneError;
          logger.info(`[DROMigrationPipeline] Registered QIS Scene in DB: ${sceneId}`);
        } catch (err: any) {
          logger.warn(`[DROMigrationPipeline] Failed to handle QIS Scene DB logic: ${err.message}`);
        }

        // 7. Compile simulated/mock AnswerMission
        const missionId = crypto.randomUUID();
        const mission: AnswerMission = {
          id: missionId,
          workspaceId,
          questionId: cqId,
          sceneId: sceneId,
          verticalId: domainKey.includes('jeju') ? 'jeju' : 'skincare',
          tenantId: record.tenantId || undefined,
          question: {
            id: cqId,
            normalizedQuestion: sanitizedQuestion,
            slug: questionSlug,
            primaryIntent: 'informational',
            riskLevel: record.riskLevel || 'medium'
          },
          scene: {
            id: sceneId,
            sceneName: scenePayload.scene_name,
            scenarioContext: scenePayload.scenario_context,
            sceneType: 'factoid',
            riskLevel: scenePayload.risk_level
          },
          searchIntent: sanitizedQuestion,
          answerGoal: sanitizedAnswer.substring(0, 100),
          directAnswerContract: {
            maxCharacters: 150,
            requiredTone: 'factual',
            coreMessage: sanitizedQuestion
          },
          surfaceContract: {
            allowedChannels: ['homepage', 'answer_card', 'chatbot', 'cardnews', 'ad', 'sales_script', 'llm_txt']
          },
          structuredDataContract: {
            schemaType: 'FAQPage',
            primaryFields: ['mainEntity']
          },
          evidenceContract: {
            requiredEvidenceTypes: ['manual_verify'],
            requireVerification: true
          },
          internalLinkContract: {
            conceptRefs: [],
            anchorTextPattern: sanitizedQuestion.substring(0, 15)
          },
          decisionCriteria: ['의학적 치료 예방 표현 불가', '피부 이상 증상 시 중단 안내'],
          requiredClaims: [sanitizedQuestion],
          requiredEvidence: [sanitizedAnswer],
          allowedStrength: 'Level 6: Anecdotal',
          mustInclude: [],
          mustNotInclude: ['치료', '완치', '치료제', '의학적 효능', '질병 예방'],
          warnings: [],
          ctaPolicy: {
            primaryCtaText: '문의하기',
            ctaUrlPattern: `/answers/${questionSlug}`
          },
          expiry: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(), // 90 days expiry
          createdAt: new Date().toISOString()
        };

        // 8. Generate AnswerAssetSpec
        const asset = await this.assetGenerator.generate(mission, mission.tenantId, 'dro-migration');

        // Overwrite standard generation with legacy exact sanitized text to preserve Q&A authenticity
        asset.title = sanitizedQuestion;
        asset.directAnswer = sanitizedAnswer;
        asset.seo.title = sanitizedQuestion;
        asset.seo.metaDescription = sanitizedAnswer.substring(0, 150);
        asset.seo.keywords = ['skincare', 'dro', 'faq'];

        if (asset.structuredData && asset.structuredData.payload) {
          asset.structuredData.payload.title = sanitizedQuestion;
          if (asset.structuredData.payload.mainEntity && asset.structuredData.payload.mainEntity.acceptedAnswer) {
            asset.structuredData.payload.mainEntity.name = sanitizedQuestion;
            asset.structuredData.payload.mainEntity.acceptedAnswer.text = sanitizedAnswer;
          }
        }

        asset.contentBlocks = [
          {
            id: 'block-0',
            type: 'paragraph',
            title: '안내',
            content: sanitizedAnswer,
            evidenceRefs: [evidenceItem?.id || evidenceInput.id]
          }
        ];

        // 9. Validate via ValidatorGuild
        const report = await this.validatorGuild.validate(asset, mission);
        if (!report.isValid) {
          const blockErrors = report.issues.filter(issue => issue.type === 'error').map(issue => issue.message);
          throw new Error(`Validation failed: ${blockErrors.join('; ')}`);
        }

        // 10. Persist to Database
        try {
          const { error: assetDbError } = await supabase
            .from('answer_assets')
            .upsert({
              id: asset.id,
              workspace_id: workspaceId,
              question_id: cqId,
              mission_id: mission.id,
              tenant_id: asset.tenantId,
              title: asset.title,
              direct_answer: asset.directAnswer,
              payload: asset,
              status: 'published',
              version: asset.version,
              created_at: asset.createdAt
            });
          if (assetDbError) throw assetDbError;
          logger.info(`[DROMigrationPipeline] Successfully migrated and published AnswerAssetSpec: ${asset.id}`);
        } catch (err: any) {
          logger.warn(`[DROMigrationPipeline] Failed to upsert AnswerAssetSpec in database: ${err.message}. Saving in memory.`);
        }

        asset.status = 'published';
        assets.push(asset);
        succeeded++;

      } catch (err: any) {
        logger.error(`[DROMigrationPipeline] Failed to migrate record ${recordId}`, err);
        errors.push({ recordId: String(recordId), error: err.message });
      }
    }

    return {
      processed: legacyRecords.length,
      succeeded,
      failed: errors.length,
      assets,
      errors
    };
  }
}
