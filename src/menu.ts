import { attachSystemTheme, IThemeController } from './core/theme';
import { getRequiredElement } from './core/dom';

const CONSENT_OVERLAY_HOST_ID = 'goblin-consent-host';
const CONSENT_CLOSE_MESSAGE_TYPE = 'GOBLIN_CONSENT_CLOSE';

const showConsentButton = getRequiredElement<HTMLButtonElement>('#showConsentButton');
const editConsentButton = getRequiredElement<HTMLButtonElement>('#editConsentButton');

let themeController: IThemeController | null = null;
let isDisposed = false;

interface IActiveTabContext {
  tabId: number;
  windowId: number;
}

declare global {
  interface Window {
    __goblinConsentCleanup__?: () => void;
  }
}

function mountConsentOverlay(iframeUrl: string, overlayHostId: string, closeMessageType: string): void {
  const existingCleanup = window.__goblinConsentCleanup__;

  if (existingCleanup) {
    existingCleanup();
  }

  const extensionOrigin = new URL(iframeUrl).origin;
  const host = document.createElement('div');
  host.id = overlayHostId;

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const backdrop = document.createElement('div');
  const frame = document.createElement('iframe');

  backdrop.setAttribute('role', 'presentation');
  backdrop.style.position = 'fixed';
  backdrop.style.inset = '0';
  backdrop.style.zIndex = '2147483647';
  backdrop.style.display = 'grid';
  backdrop.style.placeItems = 'center';
  backdrop.style.padding = '24px';
  backdrop.style.background = 'rgba(15, 23, 42, 0.42)';
  backdrop.style.backdropFilter = 'blur(8px)';

  frame.src = iframeUrl;
  frame.title = 'Goblin Consent';
  frame.style.width = 'min(460px, 100%)';
  frame.style.height = 'min(560px, calc(100vh - 48px))';
  frame.style.border = '0';
  frame.style.borderRadius = '24px';
  frame.style.background = 'transparent';
  frame.style.boxShadow = '0 24px 80px rgba(15, 23, 42, 0.28)';
  frame.style.overflow = 'hidden';

  function cleanup(): void {
    window.removeEventListener('message', handleMessage);
    window.removeEventListener('keydown', handleKeyDown, true);
    host.remove();
    delete window.__goblinConsentCleanup__;
  }

  function handleMessage(event: MessageEvent): void {
    if (event.origin !== extensionOrigin) {
      return;
    }

    if (event.data?.type !== closeMessageType) {
      return;
    }

    cleanup();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      cleanup();
    }
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      cleanup();
    }
  });

  backdrop.appendChild(frame);
  shadowRoot.appendChild(backdrop);
  document.documentElement.appendChild(host);

  window.addEventListener('message', handleMessage);
  window.addEventListener('keydown', handleKeyDown, true);
  window.__goblinConsentCleanup__ = cleanup;
}

function handleShowConsentButtonClick(): void {
  void showConsentInsidePage().then(() => {
    window.close();
  });
}

function handleEditConsentButtonClick(): void {
  void openEditorSidePanel().then(() => {
    window.close();
  });
}

async function getActiveTabContext(): Promise<IActiveTabContext> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (activeTab?.id === undefined || activeTab.windowId === undefined) {
    throw new Error('Active tab is not available');
  }

  return {
    tabId: activeTab.id,
    windowId: activeTab.windowId
  };
}

async function showConsentInsidePage(): Promise<void> {
  const { tabId } = await getActiveTabContext();

  await chrome.scripting.executeScript({
    target: { tabId },
    func: mountConsentOverlay,
    args: [
      chrome.runtime.getURL('consent.html?embedded=1'),
      CONSENT_OVERLAY_HOST_ID,
      CONSENT_CLOSE_MESSAGE_TYPE
    ]
  });
}

async function openEditorSidePanel(): Promise<void> {
  const { tabId, windowId } = await getActiveTabContext();

  await chrome.sidePanel.setOptions({
    tabId,
    path: 'editor.html',
    enabled: true
  });

  await chrome.sidePanel.open({
    tabId,
    windowId
  });
}

function handlePageHide(): void {
  dispose();
}

function handleBeforeUnload(): void {
  dispose();
}

function registerMenuListeners(): void {
  showConsentButton.addEventListener('click', handleShowConsentButtonClick);
  editConsentButton.addEventListener('click', handleEditConsentButtonClick);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('beforeunload', handleBeforeUnload);
}

function unregisterMenuListeners(): void {
  showConsentButton.removeEventListener('click', handleShowConsentButtonClick);
  editConsentButton.removeEventListener('click', handleEditConsentButtonClick);
  window.removeEventListener('pagehide', handlePageHide);
  window.removeEventListener('beforeunload', handleBeforeUnload);
}

function dispose(): void {
  if (isDisposed) {
    return;
  }

  unregisterMenuListeners();

  if (themeController) {
    themeController.dispose();
    themeController = null;
  }

  isDisposed = true;
}

function bootstrap(): void {
  themeController = attachSystemTheme();
  registerMenuListeners();
}

bootstrap();
