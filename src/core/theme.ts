export interface IThemeController {
  dispose: () => void;
}

function applyTheme(root: HTMLElement, mediaQueryList: MediaQueryList): void {
  const theme = mediaQueryList.matches ? 'dark' : 'light';
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function attachSystemTheme(): IThemeController {
  const root = document.documentElement;
  const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
  let isDisposed = false;

  function handleThemeChange(): void {
    applyTheme(root, mediaQueryList);
  }

  function dispose(): void {
    if (isDisposed) {
      return;
    }

    mediaQueryList.removeEventListener('change', handleThemeChange);
    isDisposed = true;
  }

  handleThemeChange();
  mediaQueryList.addEventListener('change', handleThemeChange);

  return {
    dispose
  };
}
