import { EmergenceSignal } from "../../schema";
import { SignalCollector } from "../types";
import { env } from "../../env";

const KWEDDINGHUB_API_URL = env.HUB_API_URL;
const KWEDDINGHUB_API_KEY = env.HUB_API_KEY || '';

export class KWeddingHubCollector implements SignalCollector {
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    const targetIndustry = industry ?? "wedding";

    // KWeddingHub 수집기는 웨딩 업종만 지원합니다.
    if (targetIndustry !== "wedding") {
      return [];
    }

    try {
      console.log(`[KWeddingHubCollector] Pulling QIS signals from KWeddingHub: ${KWEDDINGHUB_API_URL}...`);
      
      const response = await fetch(`${KWEDDINGHUB_API_URL}/api/v1/qis/signals`, {
        method: 'POST',
        headers: {
          'X-QIS-Api-Key': KWEDDINGHUB_API_KEY,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`[KWeddingHubCollector] Bridge API returned error status ${response.status}: ${text}`);
        return [];
      }

      const resData = await response.json();
      if (!resData.ok || !Array.isArray(resData.data)) {
        console.warn(`[KWeddingHubCollector] Invalid bridge response:`, resData);
        return [];
      }

      const rawSignals = resData.data;
      console.log(`[KWeddingHubCollector] Successfully pulled ${rawSignals.length} signals from KWeddingHub.`);

      // EmergenceSignal 규격으로 매핑하여 반환
      return rawSignals.map((sig: any) => ({
        workspace_id: workspaceId || null,
        source_type: "kweddinghub",
        industry: "wedding",
        raw_text: sig.raw_text,
        source_url: null,
        ai_analysis: {
          source_channel: sig.signal_type,
          user_sentiment: "neutral",
          urgency_rating: sig.predicted_impact === "critical" || sig.predicted_impact === "high" ? "high" : "medium",
          ...sig.metadata,
        },
        predicted_impact: sig.predicted_impact === "critical" ? "critical" : sig.predicted_impact === "high" ? "high" : sig.predicted_impact === "low" ? "low" : "medium",
        status: "new",
      }));
    } catch (err) {
      console.error("[KWeddingHubCollector] Failed to collect signals from KWeddingHub bridge", err);
      return [];
    }
  }
}
