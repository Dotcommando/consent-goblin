import { DIALOG_STORAGE_KEY, IDialogState, loadDialogState } from './core/dialog';
import { attachSystemTheme, IThemeController } from './core/theme';
import { getRequiredElement } from './core/dom';

const EMBEDDED_CLOSE_MESSAGE_TYPE = 'GOBLIN_CONSENT_CLOSE';

const siteLabel = getRequiredElement<HTMLSpanElement>('#siteLabel');
const dialogTitle = getRequiredElement<HTMLHeadingElement>('#dialogTitle');
const dialogItems = getRequiredElement<HTMLUListElement>('#dialogItems');
const secondaryActionButton = getRequiredElement<HTMLButtonElement>('#secondaryActionButton');
const primaryActionButton = getRequiredElement<HTMLButtonElement>('#primaryActionButton');

let themeController: IThemeController | null = null;
let isDisposed = false;
const isEmbedded = new URLSearchParams(window.location.search).get('embedded') === '1' || window.top !== window;

function renderDialog(state: IDialogState): void {
  siteLabel.textContent = state.siteLabel;
  dialogTitle.textContent = state.title;
  secondaryActionButton.textContent = state.secondaryActionLabel;
  primaryActionButton.textContent = state.primaryActionLabel;

  dialogItems.innerHTML = '';

  for (const item of state.items) {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    dialogItems.appendChild(listItem);
  }
}

async function renderLatestDialog(): Promise<void> {
  renderDialog(await loadDialogState());
}

function handleStorageChange(
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string
): void {
  if (areaName !== 'local' || !(DIALOG_STORAGE_KEY in changes)) {
    return;
  }

  void renderLatestDialog();
}

function closeEmbeddedDialog(): void {
  window.parent.postMessage({ type: EMBEDDED_CLOSE_MESSAGE_TYPE }, '*');
}

function handleSecondaryActionButtonClick(): void {
  if (isEmbedded) {
    closeEmbeddedDialog();
    return;
  }

  window.close();
}

function handlePrimaryActionButtonClick(): void {
  if (isEmbedded) {
    closeEmbeddedDialog();
    return;
  }

  window.close();
}

function handlePageHide(): void {
  dispose();
}

function handleBeforeUnload(): void {
  dispose();
}

function registerConsentListeners(): void {
  chrome.storage.onChanged.addListener(handleStorageChange);
  secondaryActionButton.addEventListener('click', handleSecondaryActionButtonClick);
  primaryActionButton.addEventListener('click', handlePrimaryActionButtonClick);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('beforeunload', handleBeforeUnload);
}

function unregisterConsentListeners(): void {
  chrome.storage.onChanged.removeListener(handleStorageChange);
  secondaryActionButton.removeEventListener('click', handleSecondaryActionButtonClick);
  primaryActionButton.removeEventListener('click', handlePrimaryActionButtonClick);
  window.removeEventListener('pagehide', handlePageHide);
  window.removeEventListener('beforeunload', handleBeforeUnload);
}

function dispose(): void {
  if (isDisposed) {
    return;
  }

  unregisterConsentListeners();

  if (themeController) {
    themeController.dispose();
    themeController = null;
  }

  isDisposed = true;
}

async function bootstrap(): Promise<void> {
  if (isEmbedded) {
    document.body.classList.add('page-consent-embedded');
  }

  themeController = attachSystemTheme();

  renderDialog(await loadDialogState());
  registerConsentListeners();
}

void bootstrap();
