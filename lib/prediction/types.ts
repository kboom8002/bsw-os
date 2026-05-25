import { EmergenceSignal } from "../schema";

export interface SignalCollector {
  collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]>;
}
