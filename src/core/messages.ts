export enum EMenuAction {
  OPEN_CONSENT_WINDOW = 'OPEN_CONSENT_WINDOW',
  OPEN_EDITOR_WINDOW = 'OPEN_EDITOR_WINDOW'
}

export interface IOpenWindowMessage {
  type: EMenuAction;
  sourceWindowId?: number;
}

function isMenuAction(value: unknown): value is EMenuAction {
  return value === EMenuAction.OPEN_CONSENT_WINDOW || value === EMenuAction.OPEN_EDITOR_WINDOW;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isOpenWindowMessage(value: unknown): value is IOpenWindowMessage {
  if (!isRecord(value)) {
    return false;
  }

  if (!isMenuAction(value.type)) {
    return false;
  }

  if (value.sourceWindowId !== undefined && typeof value.sourceWindowId !== 'number') {
    return false;
  }

  return true;
}
