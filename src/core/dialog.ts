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
    'Sell your soul to the devil',
    'Claim the right of first night',
    'Take custody of your firstborn',
    'Access your private meme archives'
  ],
  secondaryActionLabel: 'Block',
  primaryActionLabel: 'Allow'
};

const DIALOG_PRESETS: IDialogPreset[] = [
  {
    id: 'infernal-contract',
    label: 'Infernal Contract',
    state: {
      siteLabel: 'portal-of-ruin.example',
      title: 'This app wants permission to:',
      items: [
        'Sell your soul to the devil',
        'Transfer your firstborn into eternal service',
        'Read your thoughts during awkward silence',
        'Bill your descendants for hidden fees'
      ],
      secondaryActionLabel: 'Deny',
      primaryActionLabel: 'Summon'
    }
  },
  {
    id: 'startup-terms',
    label: 'Startup Terms',
    state: {
      siteLabel: 'hypergrowth-ai.example',
      title: 'This app wants permission to:',
      items: [
        'Monetize your free time',
        'Rebrand your personality for enterprise clients',
        'Harvest your best ideas during sleep',
        'Convert your family into monthly recurring revenue'
      ],
      secondaryActionLabel: 'Not now',
      primaryActionLabel: 'Scale me'
    }
  },
  {
    id: 'royal-decree',
    label: 'Royal Decree',
    state: {
      siteLabel: 'crown-authority.example',
      title: 'The Crown requests permission to:',
      items: [
        'Exercise the right of first night',
        'Seize your finest livestock',
        'Confiscate your dignity on public holidays',
        'Replace your surname with a tax number'
      ],
      secondaryActionLabel: 'Resist',
      primaryActionLabel: 'Obey'
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
