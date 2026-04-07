let areRuntimeListenersRegistered = false;
let areLifecycleListenersRegistered = false;

function createCircleIcon(size: number): ImageData {
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('2D context is not available');
  }

  const center = size / 2;
  const radius = size * 0.42;

  context.clearRect(0, 0, size, size);

  context.fillStyle = '#7c3aed';
  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = 'rgba(255, 255, 255, 0.18)';
  context.beginPath();
  context.arc(center - size * 0.12, center - size * 0.14, radius * 0.55, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = 'rgba(255, 255, 255, 0.26)';
  context.lineWidth = Math.max(1, size * 0.06);
  context.beginPath();
  context.arc(center, center, radius - context.lineWidth / 2, 0, Math.PI * 2);
  context.stroke();

  return context.getImageData(0, 0, size, size);
}

async function setActionIcon(): Promise<void> {
  await chrome.action.setIcon({
    imageData: {
      16: createCircleIcon(16),
      32: createCircleIcon(32),
      48: createCircleIcon(48),
      128: createCircleIcon(128)
    }
  });
}

function handleRuntimeInstalled(): void {
  void setActionIcon();
}

function handleRuntimeStartup(): void {
  void setActionIcon();
}

function handleRuntimeSuspend(): void {
  unregisterRuntimeListeners();
}

function handleRuntimeSuspendCanceled(): void {
  registerRuntimeListeners();
}

function registerRuntimeListeners(): void {
  if (areRuntimeListenersRegistered) {
    return;
  }

  chrome.runtime.onInstalled.addListener(handleRuntimeInstalled);
  chrome.runtime.onStartup.addListener(handleRuntimeStartup);

  areRuntimeListenersRegistered = true;
}

function unregisterRuntimeListeners(): void {
  if (!areRuntimeListenersRegistered) {
    return;
  }

  chrome.runtime.onInstalled.removeListener(handleRuntimeInstalled);
  chrome.runtime.onStartup.removeListener(handleRuntimeStartup);

  areRuntimeListenersRegistered = false;
}

function registerLifecycleListeners(): void {
  if (areLifecycleListenersRegistered) {
    return;
  }

  chrome.runtime.onSuspend.addListener(handleRuntimeSuspend);
  chrome.runtime.onSuspendCanceled.addListener(handleRuntimeSuspendCanceled);

  areLifecycleListenersRegistered = true;
}

function bootstrap(): void {
  registerLifecycleListeners();
  registerRuntimeListeners();
  void setActionIcon();
}

bootstrap();
