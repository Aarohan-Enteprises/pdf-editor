// Workflow execution engine - chains PDF operations sequentially

export type StepType = 'rotate' | 'reverse' | 'page-numbers' | 'watermark' | 'edit-metadata' | 'flatten' | 'compress' | 'lock';

export interface WorkflowStep {
  id: string;
  type: StepType;
  config: Record<string, string | number | boolean>;
}

export interface WorkflowTemplate {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string; // emoji or identifier
  gradient: string;
  lightBg: string;
  textColor: string;
  steps: WorkflowStep[];
  featured?: boolean;
}

export interface CustomWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: number;
  updatedAt: number;
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'error';

export interface StepProgress {
  stepId: string;
  status: StepStatus;
  error?: string;
}

export interface WorkflowProgress {
  currentStepIndex: number;
  steps: StepProgress[];
  isComplete: boolean;
  error?: string;
}

export type ProgressCallback = (progress: WorkflowProgress) => void;

export interface StepExecutor {
  execute: (pdfData: Uint8Array, config: Record<string, string | number | boolean>) => Promise<Uint8Array>;
}

export async function executeWorkflow(
  pdfData: Uint8Array,
  steps: WorkflowStep[],
  executors: Record<StepType, StepExecutor>,
  onProgress: ProgressCallback
): Promise<Uint8Array> {
  const progress: WorkflowProgress = {
    currentStepIndex: 0,
    steps: steps.map((s) => ({ stepId: s.id, status: 'pending' as StepStatus })),
    isComplete: false,
  };

  onProgress({ ...progress, steps: [...progress.steps] });

  let currentData = pdfData;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    progress.currentStepIndex = i;
    progress.steps[i] = { stepId: step.id, status: 'running' };
    onProgress({ ...progress, steps: [...progress.steps] });

    try {
      const executor = executors[step.type];
      if (!executor) {
        throw new Error(`No executor found for step type: ${step.type}`);
      }
      currentData = await executor.execute(currentData, step.config);
      progress.steps[i] = { stepId: step.id, status: 'completed' };
      onProgress({ ...progress, steps: [...progress.steps] });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      progress.steps[i] = { stepId: step.id, status: 'error', error: errorMessage };
      progress.error = errorMessage;
      onProgress({ ...progress, steps: [...progress.steps] });
      throw err;
    }
  }

  progress.isComplete = true;
  onProgress({ ...progress, steps: [...progress.steps] });

  return currentData;
}
