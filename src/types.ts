export type ScriptLanguage = 'typescript' | 'javascript' | 'python_async' | 'python_sync';

export type WaitStrategy = 'promise_race' | 'locator_or';

export type BatchExecutionMode = 'sequential' | 'concurrent';

export type TargetEnvironment = 'desktop' | 'termux';

export interface ScriptConfig {
  email: string;
  emailsText: string;
  isMultiEmail: boolean;
  batchMode: BatchExecutionMode;
  concurrencyLimit: number;
  delayBetweenEmailsMs: number;
  freshContextPerEmail: boolean;
  timeoutMs: number;
  headless: boolean;
  slowMoMs: number;
  useStealth: boolean;
  language: ScriptLanguage;
  waitStrategy: WaitStrategy;
  saveScreenshots: boolean;
  locale: 'id-ID' | 'en-US';
  exportFormat: 'csv' | 'json';
  targetEnvironment: TargetEnvironment;
  termuxCustomChromiumPath: string;
}

export type DetectionOutcome = 
  | 'PASSWORD_FIELD_FOUND' 
  | 'ROBOT_VERIFICATION_FOUND' 
  | 'EMAIL_NOT_FOUND' 
  | 'BROWSER_BLOCKED_INSECURE'
  | 'TIMEOUT';

export interface BatchResultItem {
  id: string;
  email: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  outcome?: DetectionOutcome;
  durationMs?: number;
  timestamp?: string;
  details?: string;
}

export interface SimulatorState {
  currentStep: 'initial' | 'navigating' | 'typing_email' | 'clicking_next' | 'waiting_outcome' | 'finished';
  email: string;
  simulatedOutcome: DetectionOutcome;
  logs: Array<{ timestamp: string; type: 'info' | 'success' | 'warn' | 'error'; message: string }>;
  detectedSelector?: string;
}
