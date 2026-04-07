import {
  DIALOG_STORAGE_KEY,
  IDialogPreset,
  IDialogState,
  getDefaultDialogState,
  getDialogPresets,
  loadDialogState,
  parseDialogItems,
  saveDialogState
} from './core/dialog';
import { attachSystemTheme, IThemeController } from './core/theme';
import { getRequiredElement } from './core/dom';

const presetList = getRequiredElement<HTMLDivElement>('#presetList');
const siteLabelInput = getRequiredElement<HTMLInputElement>('#siteLabelInput');
const titleInput = getRequiredElement<HTMLInputElement>('#titleInput');
const itemsInput = getRequiredElement<HTMLTextAreaElement>('#itemsInput');
const secondaryActionInput = getRequiredElement<HTMLInputElement>('#secondaryActionInput');
const primaryActionInput = getRequiredElement<HTMLInputElement>('#primaryActionInput');
const resetButton = getRequiredElement<HTMLButtonElement>('#resetButton');
const applyButton = getRequiredElement<HTMLButtonElement>('#applyButton');

const presetsById = new Map<string, IDialogPreset>();

let themeController: IThemeController | null = null;
let isDisposed = false;

function fillForm(state: IDialogState): void {
  siteLabelInput.value = state.siteLabel;
  titleInput.value = state.title;
  itemsInput.value = state.items.join('\n');
  secondaryActionInput.value = state.secondaryActionLabel;
  primaryActionInput.value = state.primaryActionLabel;
}

function readFormState(): IDialogState {
  const defaultState = getDefaultDialogState();
  const items = parseDialogItems(itemsInput.value);

  return {
    siteLabel: siteLabelInput.value.trim() || defaultState.siteLabel,
    title: titleInput.value.trim() || defaultState.title,
    items: items.length > 0 ? items : defaultState.items,
    secondaryActionLabel: secondaryActionInput.value.trim() || defaultState.secondaryActionLabel,
    primaryActionLabel: primaryActionInput.value.trim() || defaultState.primaryActionLabel
  };
}

async function applyState(state: IDialogState): Promise<void> {
  fillForm(state);
  await saveDialogState(state);
}

function renderPresets(): void {
  const presets = getDialogPresets();

  presetsById.clear();
  presetList.innerHTML = '';

  for (const preset of presets) {
    presetsById.set(preset.id, preset);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-chip';
    button.dataset.presetId = preset.id;
    button.textContent = preset.label;

    presetList.appendChild(button);
  }
}

function findPresetButton(target: EventTarget | null): HTMLButtonElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const button = target.closest('button[data-preset-id]');

  return button instanceof HTMLButtonElement
    ? button
    : null;
}

function handlePresetListClick(event: MouseEvent): void {
  const button = findPresetButton(event.target);

  if (!button) {
    return;
  }

  const presetId = button.dataset.presetId;

  if (!presetId) {
    return;
  }

  const preset = presetsById.get(presetId);

  if (!preset) {
    return;
  }

  void applyState(preset.state);
}

function handleApplyButtonClick(): void {
  void applyState(readFormState());
}

function handleResetButtonClick(): void {
  void applyState(getDefaultDialogState());
}

function handleWindowKeyDown(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    void applyState(readFormState());
  }
}

function handleStorageChange(
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string
): void {
  if (areaName !== 'local' || !(DIALOG_STORAGE_KEY in changes)) {
    return;
  }

  void loadDialogState().then(fillForm);
}

function handlePageHide(): void {
  dispose();
}

function handleBeforeUnload(): void {
  dispose();
}

function registerEditorListeners(): void {
  presetList.addEventListener('click', handlePresetListClick);
  applyButton.addEventListener('click', handleApplyButtonClick);
  resetButton.addEventListener('click', handleResetButtonClick);
  window.addEventListener('keydown', handleWindowKeyDown);
  chrome.storage.onChanged.addListener(handleStorageChange);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('beforeunload', handleBeforeUnload);
}

function unregisterEditorListeners(): void {
  presetList.removeEventListener('click', handlePresetListClick);
  applyButton.removeEventListener('click', handleApplyButtonClick);
  resetButton.removeEventListener('click', handleResetButtonClick);
  window.removeEventListener('keydown', handleWindowKeyDown);
  chrome.storage.onChanged.removeListener(handleStorageChange);
  window.removeEventListener('pagehide', handlePageHide);
  window.removeEventListener('beforeunload', handleBeforeUnload);
}

function dispose(): void {
  if (isDisposed) {
    return;
  }

  unregisterEditorListeners();

  if (themeController) {
    themeController.dispose();
    themeController = null;
  }

  isDisposed = true;
}

async function bootstrap(): Promise<void> {
  themeController = attachSystemTheme();

  renderPresets();
  fillForm(await loadDialogState());
  registerEditorListeners();
}

void bootstrap();
