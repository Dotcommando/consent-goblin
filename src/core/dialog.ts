export interface IDialogState {
  siteLabel: string;
  title: string;
  items: string[];
  secondaryActionLabel: string;
  primaryActionLabel: string;
}

export interface IDialogPreset {
  id: string;
  label: string;
  state: IDialogState;
}

export const DIALOG_STORAGE_KEY = 'goblin-consent-dialog-state';

const DEFAULT_DIALOG_STATE: IDialogState = {
  siteLabel: 'untrusted-app.example',
  title: 'This app wants permission to:',
  items: [
    'Store your language preference',
    'Remember your sign-in status',
    'Show product updates in this workspace',
    'Use analytics for a mock product demo'
  ],
  secondaryActionLabel: 'Not now',
  primaryActionLabel: 'Continue'
};

const DIALOG_PRESETS: IDialogPreset[] = [
  {
    id: 'product-onboarding',
    label: 'Product Onboarding',
    state: {
      siteLabel: 'workspace-demo.example',
      title: 'This app wants permission to:',
      items: [
        'Save your preferences for future sessions',
        'Show contextual onboarding tips',
        'Measure feature adoption in this demo',
        'Remember dismissed setup prompts'
      ],
      secondaryActionLabel: 'Skip',
      primaryActionLabel: 'Continue'
    }
  },
  {
    id: 'beta-access',
    label: 'Beta Access',
    state: {
      siteLabel: 'labs-preview.example',
      title: 'This app wants permission to:',
      items: [
        'Enable beta workspace features',
        'Collect anonymous usability feedback',
        'Store temporary session preferences',
        'Show feature announcements in-product'
      ],
      secondaryActionLabel: 'Later',
      primaryActionLabel: 'Enable beta'
    }
  },
  {
    id: 'admin-workflow',
    label: 'Admin Workflow',
    state: {
      siteLabel: 'admin-console.example',
      title: 'This admin tool wants permission to:',
      items: [
        'Access organization settings',
        'Store audit view preferences',
        'Display workflow reminders in context',
        'Save approval state in this mockup'
      ],
      secondaryActionLabel: 'Cancel',
      primaryActionLabel: 'Proceed'
    }
  }
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeItems(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return items.length > 0 ? items : [...fallback];
}

function cloneState(state: IDialogState): IDialogState {
  return {
    siteLabel: state.siteLabel,
    title: state.title,
    items: [...state.items],
    secondaryActionLabel: state.secondaryActionLabel,
    primaryActionLabel: state.primaryActionLabel
  };
}

function normalizeState(value: unknown): IDialogState {
  if (!isRecord(value)) {
    return cloneState(DEFAULT_DIALOG_STATE);
  }

  return {
    siteLabel: normalizeText(value.siteLabel, DEFAULT_DIALOG_STATE.siteLabel),
    title: normalizeText(value.title, DEFAULT_DIALOG_STATE.title),
    items: normalizeItems(value.items, DEFAULT_DIALOG_STATE.items),
    secondaryActionLabel: normalizeText(value.secondaryActionLabel, DEFAULT_DIALOG_STATE.secondaryActionLabel),
    primaryActionLabel: normalizeText(value.primaryActionLabel, DEFAULT_DIALOG_STATE.primaryActionLabel)
  };
}

export function parseDialogItems(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function getDefaultDialogState(): IDialogState {
  return cloneState(DEFAULT_DIALOG_STATE);
}

export function getDialogPresets(): IDialogPreset[] {
  return DIALOG_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    state: cloneState(preset.state)
  }));
}

export async function loadDialogState(): Promise<IDialogState> {
  const storedValues = await chrome.storage.local.get(DIALOG_STORAGE_KEY);
  return normalizeState(storedValues[DIALOG_STORAGE_KEY]);
}

export async function saveDialogState(state: IDialogState): Promise<void> {
  await chrome.storage.local.set({
    [DIALOG_STORAGE_KEY]: cloneState(state)
  });
}

export async function resetDialogState(): Promise<IDialogState> {
  const state = getDefaultDialogState();
  await saveDialogState(state);
  return state;
}
