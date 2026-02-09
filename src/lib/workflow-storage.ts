// localStorage CRUD for custom workflows

import type { CustomWorkflow, WorkflowStep } from './workflow-engine';

const STORAGE_KEY = 'pdf2-custom-workflows';

export function getCustomWorkflows(): CustomWorkflow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomWorkflow(workflow: CustomWorkflow): void {
  const workflows = getCustomWorkflows();
  const index = workflows.findIndex((w) => w.id === workflow.id);
  if (index >= 0) {
    workflows[index] = { ...workflow, updatedAt: Date.now() };
  } else {
    workflows.push({ ...workflow, createdAt: Date.now(), updatedAt: Date.now() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

export function deleteCustomWorkflow(id: string): void {
  const workflows = getCustomWorkflows().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

export function generateWorkflowId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function cloneStepsWithNewIds(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((s) => ({ ...s, id: generateStepId(), config: { ...s.config } }));
}
