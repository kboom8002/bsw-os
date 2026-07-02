/**
 * lib/knowledge-graph/ontology-schema.ts
 *
 * 지식 그래프 온톨로지 스키마 및 일관성 검증 엔진.
 */

export interface OntologyNodeType {
  level: 'class' | 'instance';
  maxParents: number;
  requiredEdges?: string[];
}

export interface OntologyEdgeConstraint {
  domain: string[];
  range: string[];
  transitive: boolean;
  maxPerSource?: number;
}

export interface OntologySchema {
  nodeTypes: Record<string, OntologyNodeType>;
  edgeConstraints: Record<string, OntologyEdgeConstraint>;
}

export const INDUSTRY_ONTOLOGY_SCHEMA: OntologySchema = {
  nodeTypes: {
    'concept':    { level: 'class', maxParents: 3 },
    'product':    { level: 'instance', maxParents: 2, requiredEdges: ['is_a'] },
    'service':    { level: 'instance', maxParents: 2, requiredEdges: ['is_a'] },
    'concern':    { level: 'class', maxParents: 2 },
    'process':    { level: 'instance', maxParents: 1, requiredEdges: ['part_of'] },
    'regulation': { level: 'class', maxParents: 1 },
    'persona':    { level: 'instance', maxParents: 0 },
  },
  edgeConstraints: {
    'is_a':              { domain: ['instance'], range: ['class'], transitive: true },
    'part_of':           { domain: ['class', 'instance'], range: ['class'], transitive: true },
    'resolves_question': { domain: ['concept', 'product', 'service'], range: ['concern'], transitive: false },
    'causes':            { domain: ['concern', 'process'], range: ['concern'], transitive: false },
    'requires':          { domain: ['product', 'service'], range: ['process', 'regulation'], transitive: false },
    'competes_with':     { domain: ['product', 'service'], range: ['product', 'service'], transitive: false },
    'regulates':         { domain: ['regulation'], range: ['product', 'service', 'process'], transitive: false },
    'targets_persona':   { domain: ['product', 'service', 'concern'], range: ['persona'], transitive: false },
  }
};

export interface KGNode {
  id: string;
  node_name: string;
  node_type: string;
}

export interface KGEdge {
  id?: string;
  source_node_name?: string; // For ease of validation mapping
  target_node_name?: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
}

export class KGValidator {
  /**
   * Taxonomic 관계(is_a, part_of)의 순환 참조 탐지 (DFS 사이클 검증)
   */
  static detectCycles(edges: KGEdge[], nodes: KGNode[]): string[] {
    const nameMap = new Map(nodes.map(n => [n.id, n.node_name]));
    const taxonomic = edges.filter(e => ['is_a', 'part_of'].includes(e.relation_type));
    
    const adj = new Map<string, string[]>();
    for (const e of taxonomic) {
      if (!adj.has(e.source_node_id)) adj.set(e.source_node_id, []);
      adj.get(e.source_node_id)!.push(e.target_node_id);
    }
    
    const cycles: string[] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();
    
    function dfs(nodeId: string): boolean {
      visited.add(nodeId);
      stack.add(nodeId);
      
      const neighbors = adj.get(nodeId) || [];
      for (const next of neighbors) {
        if (stack.has(next)) {
          const fromName = nameMap.get(nodeId) || nodeId;
          const toName = nameMap.get(next) || next;
          cycles.push(`순환 참조 감지: ${fromName} → ${toName}`);
          return true;
        }
        if (!visited.has(next) && dfs(next)) {
          return true;
        }
      }
      stack.delete(nodeId);
      return false;
    }
    
    for (const nodeId of adj.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }
    return cycles;
  }

  /**
   * 연결되지 않은 고아 노드 검출 (degree = 0)
   */
  static findOrphanNodes(nodes: KGNode[], edges: KGEdge[]): string[] {
    const activeNodeIds = new Set<string>();
    for (const e of edges) {
      activeNodeIds.add(e.source_node_id);
      activeNodeIds.add(e.target_node_id);
    }
    
    return nodes
      .filter(n => !activeNodeIds.has(n.id))
      .map(n => `고아 노드: ${n.node_name} (type: ${n.node_type})`);
  }

  /**
   * 온톨로지 도메인/범위 규칙 준수 여부 검증
   */
  static validateTypeConstraints(nodes: KGNode[], edges: KGEdge[], schema: OntologySchema): string[] {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const issues: string[] = [];

    for (const e of edges) {
      const src = nodeMap.get(e.source_node_id);
      const tgt = nodeMap.get(e.target_node_id);
      if (!src || !tgt) continue;

      const constraint = schema.edgeConstraints[e.relation_type];
      if (!constraint) {
        issues.push(`정의되지 않은 관계 타입: ${e.relation_type} (${src.node_name} → ${tgt.node_name})`);
        continue;
      }

      if (!constraint.domain.includes(src.node_type)) {
        issues.push(`도메인 타입 에러: ${e.relation_type} 관계의 출발점은 [${constraint.domain.join(', ')}] 중 하나여야 하지만 ${src.node_name}(${src.node_type})입니다.`);
      }

      if (!constraint.range.includes(tgt.node_type)) {
        issues.push(`레인지 타입 에러: ${e.relation_type} 관계의 도착점은 [${constraint.range.join(', ')}] 중 하나여야 하지만 ${tgt.node_name}(${tgt.node_type})입니다.`);
      }
    }

    return issues;
  }

  /**
   * 필수 관계 엣지 체크
   */
  static checkRequiredEdges(nodes: KGNode[], edges: KGEdge[], schema: OntologySchema): string[] {
    const issues: string[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // 각 노드별 출발 엣지 관계 수집
    const outEdges = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!outEdges.has(e.source_node_id)) {
        outEdges.set(e.source_node_id, new Set());
      }
      outEdges.get(e.source_node_id)!.add(e.relation_type);
    }

    for (const n of nodes) {
      const typeDef = schema.nodeTypes[n.node_type];
      if (typeDef?.requiredEdges) {
        const hasEdges = outEdges.get(n.id) || new Set();
        for (const req of typeDef.requiredEdges) {
          if (!hasEdges.has(req)) {
            issues.push(`필수 관계 누락: ${n.node_name}(${n.node_type}) 노드는 반드시 '${req}' 관계를 가져야 합니다.`);
          }
        }
      }
    }
    return issues;
  }

  /**
   * 중복 엣지 탐지
   */
  static findDuplicateEdges(edges: KGEdge[]): string[] {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const e of edges) {
      const key = `${e.source_node_id}::${e.target_node_id}::${e.relation_type}`;
      if (seen.has(key)) {
        duplicates.push(`중복 엣지: ${e.source_node_id} → ${e.target_node_id} (${e.relation_type})`);
      } else {
        seen.add(key);
      }
    }
    return duplicates;
  }

  /**
   * 검증 수행 및 정정 필터
   */
  static validateAndFix(nodes: KGNode[], edges: KGEdge[], schema: OntologySchema = INDUSTRY_ONTOLOGY_SCHEMA): {
    valid: boolean;
    issues: string[];
    fixedNodes: KGNode[];
    fixedEdges: KGEdge[];
  } {
    const issues: string[] = [];
    
    const cycles = this.detectCycles(edges, nodes);
    const orphans = this.findOrphanNodes(nodes, edges);
    const typeIssues = this.validateTypeConstraints(nodes, edges, schema);
    const reqIssues = this.checkRequiredEdges(nodes, edges, schema);
    const dupIssues = this.findDuplicateEdges(edges);

    issues.push(...cycles, ...orphans, ...typeIssues, ...reqIssues, ...dupIssues);

    // 자동 수정: 중복 엣지 및 부적절한 엣지 제거
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const seenEdges = new Set<string>();
    const fixedEdges: KGEdge[] = [];

    for (const e of edges) {
      const src = nodeMap.get(e.source_node_id);
      const tgt = nodeMap.get(e.target_node_id);
      if (!src || !tgt) continue;

      const constraint = schema.edgeConstraints[e.relation_type];
      if (!constraint) continue;

      // 타입 위반 엣지 제거
      if (!constraint.domain.includes(src.node_type) || !constraint.range.includes(tgt.node_type)) {
        continue;
      }

      // 중복 엣지 방지
      const key = `${e.source_node_id}::${e.target_node_id}::${e.relation_type}`;
      if (seenEdges.has(key)) {
        continue;
      }
      seenEdges.add(key);
      fixedEdges.push(e);
    }

    return {
      valid: issues.length === 0,
      issues,
      fixedNodes: nodes,
      fixedEdges
    };
  }
}
