export type AgentRole =
  | 'planner'
  | 'scene_builder'
  | 'dialogue_specialist'
  | 'description_enhancer'
  | 'consistency_editor'
  | 'compiler'
  | (string & {});

export interface AgentTemplate {
  id: string;
  name: string;
  role: AgentRole;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  promptTemplate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStep {
  id: string; // step id
  agentId: string;
  role: AgentRole;
  enabled: boolean;
  // Optional retrieval overrides per step
  retrieval?: {
    graphWeight?: number; // 0-1
    vectorWeight?: number; // 0-1
    categories?: string[];
    maxHops?: number;
  };
}

export interface AgentPipeline {
  id: string;
  name: string;
  description?: string;
  steps: PipelineStep[];
  createdAt: string;
  updatedAt: string;
}

class AgentStore {
  private agents: Map<string, AgentTemplate> = new Map();
  private pipelines: Map<string, AgentPipeline> = new Map();
  private defaultPipelineId?: string;

  listAgents(): AgentTemplate[] {
    return Array.from(this.agents.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getAgent(id: string): AgentTemplate | undefined {
    return this.agents.get(id);
  }

  upsertAgent(input: Partial<AgentTemplate> & { name: string; role: AgentRole }): AgentTemplate {
    const now = new Date().toISOString();
    if (input.id && this.agents.has(input.id)) {
      const existing = this.agents.get(input.id)!;
      const updated: AgentTemplate = {
        ...existing,
        ...input,
        updatedAt: now,
      };
      this.agents.set(updated.id, updated);
      return updated;
    }
    const id = input.id || `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const created: AgentTemplate = {
      id,
      name: input.name,
      role: input.role,
      provider: input.provider,
      model: input.model,
      temperature: input.temperature ?? 0.7,
      maxTokens: input.maxTokens ?? 1000,
      promptTemplate: input.promptTemplate ?? '',
      createdAt: now,
      updatedAt: now,
    };
    this.agents.set(id, created);
    return created;
  }

  deleteAgent(id: string): boolean {
    // Remove from any pipelines
    for (const pipeline of this.pipelines.values()) {
      const filtered = pipeline.steps.filter((s) => s.agentId !== id);
      if (filtered.length !== pipeline.steps.length) {
        pipeline.steps = filtered;
        pipeline.updatedAt = new Date().toISOString();
        this.pipelines.set(pipeline.id, pipeline);
      }
    }
    return this.agents.delete(id);
  }

  listPipelines(): AgentPipeline[] {
    return Array.from(this.pipelines.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getPipeline(id: string): AgentPipeline | undefined {
    return this.pipelines.get(id);
  }

  upsertPipeline(input: Partial<AgentPipeline> & { name: string; steps?: PipelineStep[] }): AgentPipeline {
    const now = new Date().toISOString();
    if (input.id && this.pipelines.has(input.id)) {
      const existing = this.pipelines.get(input.id)!;
      const updated: AgentPipeline = {
        ...existing,
        ...input,
        steps: input.steps ?? existing.steps,
        updatedAt: now,
      };
      this.pipelines.set(updated.id, updated);
      return updated;
    }
    const id = input.id || `pipeline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const created: AgentPipeline = {
      id,
      name: input.name,
      description: input.description ?? '',
      steps: input.steps ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.pipelines.set(id, created);
    return created;
  }

  deletePipeline(id: string): boolean {
    const ok = this.pipelines.delete(id);
    if (ok && this.defaultPipelineId === id) {
      this.defaultPipelineId = undefined;
    }
    return ok;
  }

  getDefaultPipelineId(): string | undefined {
    return this.defaultPipelineId;
  }

  setDefaultPipelineId(id?: string): void {
    if (!id) {
      this.defaultPipelineId = undefined;
      return;
    }
    if (!this.pipelines.has(id)) {
      throw new Error('Pipeline not found');
    }
    this.defaultPipelineId = id;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __AGENT_STORE__: AgentStore | undefined;
}

function getAgentStoreSingleton(): AgentStore {
  if (typeof global !== 'undefined') {
    const g = global as unknown as { __AGENT_STORE__?: AgentStore };
    if (!g.__AGENT_STORE__) {
      g.__AGENT_STORE__ = new AgentStore();
    }
    return g.__AGENT_STORE__;
  }
  return new AgentStore();
}

export const agentStore = getAgentStoreSingleton();


