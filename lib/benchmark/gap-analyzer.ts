import { SurfaceEntity, SurfaceGapAnalysis, EntityReflectionDetail } from '../schema';
import { UnifiedQuestionMapping } from '../surface/qis-cross-mapper';
import { getSupabaseAdminClient } from '../supabase';
import { TechInfraAuditResult } from '../surface/tech-infra-auditor';
import { SchemaQualityAuditResult } from '../surface/schema-quality-auditor';
import { ContentSemanticResult } from '../surface/content-semantic-analyzer';

export class GapAnalyzer {
  /**
   * Run 4-quadrant analysis and generate actionable prescriptions
   */
  async analyze(
    workspaceId: string,
    websiteUrl: string,
    entities: SurfaceEntity[],
    reflectionDetails: EntityReflectionDetail[],
    mappings: UnifiedQuestionMapping[],
    techInfra?: TechInfraAuditResult,
    schemaQuality?: SchemaQualityAuditResult,
    contentSemantic?: ContentSemanticResult
  ): Promise<SurfaceGapAnalysis[]> {
    const analysisResults: SurfaceGapAnalysis[] = [];
    const analyzedAt = new Date().toISOString();
    
    const detailMap = new Map<string, EntityReflectionDetail>();
    reflectionDetails.forEach(d => detailMap.set(d.entity_id, d));

    // 1. Process Website Entities (GREEN and YELLOW quadrants)
    entities.forEach((entity, idx) => {
      const detail = detailMap.get(entity.id || '');
      const quality = detail?.quality || 'absent';
      const isReflected = quality !== 'absent';
      const quadrant = isReflected ? 'green' : 'yellow';

      const matchingMap = mappings.find(m => m.site_question_ref?.must_include.some(w => 
        entity.entity_name.toLowerCase().includes(w.toLowerCase())
      ));

      let prescription_type: SurfaceGapAnalysis['prescription_type'] = null;
      let prescription_detail: string | null = null;
      let estimated_aepi_impact = 0;
      let priority_score = 0;

      if (quadrant === 'yellow') {
        if (!entity.has_schema_support) {
          prescription_type = 'add_schema';
          prescription_detail = `Add Schema.org JSON-LD structured markup for entity "${entity.entity_name}" (type: ${entity.surface_type}) to anchor crawlers.`;
          estimated_aepi_impact = 12.5;
        } else if (entity.eeat_strength < 55) {
          prescription_type = 'add_eeat_signal';
          prescription_detail = `Strengthen E-E-A-T signals for "${entity.entity_name}". Include advisor reviews, authority citation links, or professional credentials.`;
          estimated_aepi_impact = 15.0;
        } else {
          prescription_type = 'improve_heading';
          prescription_detail = `Format headings surrounding "${entity.entity_name}" as explicit consumer questions (H2/H3 tags) to improve LLM extractor alignment.`;
          estimated_aepi_impact = 8.5;
        }
        
        priority_score = Math.round(
          (entity.eeat_strength < 50 ? 30 : 10) + 
          (estimated_aepi_impact * 4.0)
        );

        if (detail?.competitor_mentioned) {
          prescription_detail += ` [URGENT] AI is prioritizing competitor "${detail.competitor_mentioned}" for this topic!`;
          priority_score += 25;
          estimated_aepi_impact += 5;
        }

      } else {
        if (quality === 'partial') {
          prescription_detail = `Partially reflected (${Math.round(detail!.keyword_overlap * 100)}% keywords). Consider adding exact matches.`;
          priority_score = 20;
        } else if (quality === 'distorted') {
          prescription_detail = `Distorted reflection! The engine hallucinated or mixed up facts. Explicitly correct with FAQ schema.`;
          priority_score = 40;
        } else {
          prescription_detail = 'Exact reflection confirmed. No immediate action required.';
          priority_score = 10;
        }
      }

      analysisResults.push({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        entity_name: entity.entity_name,
        entity_type: entity.surface_type,
        quadrant,
        industry_qis_layer: matchingMap?.industry_qis_layer || null,
        linked_canonical_question_id: null,
        linked_surface_entity_id: entity.id || null,
        prescription_type,
        prescription_detail,
        estimated_aepi_impact,
        priority_score,
        analyzed_at: analyzedAt
      });
    });

    // 2. Process Unmatched Industry QIS (RED quadrant - Content Gaps)
    const redMappings = mappings.filter(m => m.coverage_status === 'industry_only');
    redMappings.forEach((map, idx) => {
      const keywords = map.industry_question_ref?.must_include || [];
      const keywordsText = keywords.length > 0 ? keywords.join(', ') : '해당 주제';

      const prescription_detail = `Create high-quality authority content targeting the core consumer query: "${map.question_text}". Ensure keywords [${keywordsText}] are prominent in H2 headings.`;
      
      const estimated_aepi_impact = 18.0;
      const priority_score = Math.round(
        (map.industry_qis_layer === 'L1_universal' ? 40 : 25) + 
        (estimated_aepi_impact * 3.0)
      );

      analysisResults.push({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        entity_name: map.question_text,
        entity_type: 'industry_topic_gap',
        quadrant: 'red',
        industry_qis_layer: map.industry_qis_layer || null,
        linked_canonical_question_id: null,
        linked_surface_entity_id: null,
        prescription_type: 'create_content',
        prescription_detail,
        estimated_aepi_impact,
        priority_score,
        analyzed_at: analyzedAt
      });
    });

    // 3. Process L1: Tech Infra issues if provided
    if (techInfra && techInfra.issues) {
      const prescMap: Record<string, SurfaceGapAnalysis['prescription_type']> = {
        crawlability: 'fix_robots_txt',
        performance: 'improve_meta',
        security: 'fix_https',
        structure: 'add_canonical'
      };

      for (const issue of techInfra.issues) {
        let quad: 'red' | 'yellow' | 'white' = 'yellow';
        if (issue.severity === 'critical') quad = 'red';

        analysisResults.push({
          workspace_id: workspaceId,
          website_url: websiteUrl,
          entity_name: issue.title,
          entity_type: 'tech_infra_issue',
          quadrant: quad,
          industry_qis_layer: 'L1_universal',
          linked_canonical_question_id: null,
          linked_surface_entity_id: null,
          prescription_type: prescMap[issue.category] || 'improve_meta',
          prescription_detail: issue.description + ' Recommendation: ' + issue.recommendation,
          estimated_aepi_impact: issue.severity === 'critical' ? 20.0 : 8.0,
          priority_score: issue.severity === 'critical' ? 95 : 65,
          analyzed_at: analyzedAt
        });
      }
    }

    // 4. Process L2: Schema issues if provided
    if (schemaQuality && schemaQuality.issues) {
      for (const issue of schemaQuality.issues) {
        let quad: 'red' | 'yellow' = 'yellow';
        if (issue.severity === 'critical') quad = 'red';

        analysisResults.push({
          workspace_id: workspaceId,
          website_url: websiteUrl,
          entity_name: issue.message,
          entity_type: 'schema_quality_issue',
          quadrant: quad,
          industry_qis_layer: 'L3_ingredient',
          linked_canonical_question_id: null,
          linked_surface_entity_id: null,
          prescription_type: issue.property === 'author' ? 'add_author_markup' : 'add_schema',
          prescription_detail: issue.recommendation,
          estimated_aepi_impact: issue.severity === 'critical' ? 15.0 : 5.0,
          priority_score: issue.severity === 'critical' ? 90 : 55,
          analyzed_at: analyzedAt
        });
      }
    }

    // 5. Process L3: Content Semantic issues if provided
    if (contentSemantic && contentSemantic.issues) {
      const prescMap: Record<string, SurfaceGapAnalysis['prescription_type']> = {
        eeat: 'add_eeat_signal',
        answer_first: 'improve_heading',
        freshness: 'update_content',
        structure: 'improve_internal_linking',
        originality: 'create_content'
      };

      for (const issue of contentSemantic.issues) {
        let quad: 'red' | 'yellow' = 'yellow';
        if (issue.severity === 'critical') quad = 'red';

        analysisResults.push({
          workspace_id: workspaceId,
          website_url: websiteUrl,
          entity_name: issue.title,
          entity_type: 'content_semantic_issue',
          quadrant: quad,
          industry_qis_layer: 'L5_ymyl',
          linked_canonical_question_id: null,
          linked_surface_entity_id: null,
          prescription_type: prescMap[issue.category] || 'create_content',
          prescription_detail: issue.description + ' ' + issue.recommendation,
          estimated_aepi_impact: issue.severity === 'critical' ? 18.0 : 7.0,
          priority_score: issue.severity === 'critical' ? 88 : 60,
          analyzed_at: analyzedAt
        });
      }
    }

    // 6. Generate Opportunistic Insights (WHITE quadrant - Blue Ocean opportunities)
    const whiteOpps = mappings.filter(m => m.coverage_status === 'site_only' && m.industry_qis_layer === 'L6_trend');
    if (whiteOpps.length > 0) {
      whiteOpps.slice(0, 2).forEach((opp, idx) => {
        const qText = opp.question_text;
        analysisResults.push({
          workspace_id: workspaceId,
          website_url: websiteUrl,
          entity_name: `Trend Opportunity: ${qText}`,
          entity_type: 'white_ocean_opportunity',
          quadrant: 'white',
          industry_qis_layer: 'L6_trend',
          linked_canonical_question_id: null,
          linked_surface_entity_id: null,
          prescription_type: 'opportunity_content',
          prescription_detail: `Develop exclusive topical authority in this emerging blue-ocean area: "${qText}". No competitors are actively visible here yet.`,
          estimated_aepi_impact: 10.0,
          priority_score: 55,
          analyzed_at: analyzedAt
        });
      });
    }

    try {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from('surface_gap_analyses')
        .insert(analysisResults);
        
      if (error) {
        console.warn(`[Gap Analyzer] DB insertion failed: ${error.message}`);
      }
    } catch (_) {}

    return analysisResults;
  }
}
