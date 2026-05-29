import React from 'react';
import { getSupabaseAdminClient } from '../../../../../lib/supabase';
import { getKnowledgeGraphData } from '../../../../../app/actions/semantic';
import KnowledgeGraphCanvas from '../../../../../components/graph/KnowledgeGraphCanvas';
import { GitBranch, Info, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{
    workspace_slug: string;
  }>;
}

export default async function KnowledgeGraphPage({ params }: PageProps) {
  const { workspace_slug } = await params;
  const supabase = getSupabaseAdminClient();

  // 1. Fetch workspace by slug
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspace_slug)
    .single();

  if (wsError || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2">Workspace Not Found</h2>
        <p className="text-slate-400 text-sm max-w-md">
          The requested workspace "{workspace_slug}" does not exist or you do not have permission to view it.
        </p>
      </div>
    );
  }

  // 2. Fetch Knowledge Graph Data
  let graphData;
  try {
    graphData = await getKnowledgeGraphData(workspace.id);
  } catch (err: any) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Failed to load Knowledge Graph</h2>
        <p className="text-slate-400 text-sm max-w-md mb-4">{err.message}</p>
        <div className="text-slate-600 text-xs font-mono">
          Ensure you are logged in with appropriate Strategy/Architect RBAC credentials.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-8 bg-slate-950/20 min-h-screen">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900/60">
        <div>
          <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
            <GitBranch className="w-4 h-4" />
            <span>MeaningOps Intelligence</span>
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight mt-1">
            Brand Knowledge Graph Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">
            Interactive, dual-layer force-directed visualization combining the structured **Brand Ontology** (claims, evidence, boundaries) and the **Semantic Core** (concepts, CQs, QIS scenarios).
          </p>
        </div>
        
        {/* Floating Stat badging */}
        <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-900/80 px-4 py-2.5 rounded-2xl backdrop-blur-md">
          <div className="text-center">
            <span className="text-white text-lg font-bold block">{graphData.stats.nodeCount}</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Nodes</span>
          </div>
          <span className="h-6 w-px bg-slate-800" />
          <div className="text-center">
            <span className="text-white text-lg font-bold block">{graphData.stats.edgeCount}</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Links</span>
          </div>
          <span className="h-6 w-px bg-slate-800" />
          <div className="text-center">
            <span className="text-white text-lg font-bold block">{graphData.stats.conceptCount}</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Concepts</span>
          </div>
        </div>
      </div>

      {/* Info notice box */}
      <div className="flex gap-3 p-4 bg-violet-950/10 border border-violet-900/30 rounded-2xl text-slate-300">
        <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="text-violet-300 font-semibold">Overlapping Layer Support Active:</span> 노드가 공통의 reference_id 또는 claim lineage를 가질 때 브랜드 온톨로지와 시맨틱 코어 레이어가 유기적으로 교차 및 중첩되도록 스프링 물리 상수가 보정되었습니다. 좌측 필터를 사용해 특정 레이어를 활성화/비활성화 할 수 있습니다.
        </div>
      </div>

      {/* Interactive WebGL Force Graph Canvas Container */}
      <div className="w-full">
        <KnowledgeGraphCanvas 
          initialNodes={graphData.nodes} 
          initialLinks={graphData.links} 
          workspaceSlug={workspace_slug} 
        />
      </div>
    </div>
  );
}
