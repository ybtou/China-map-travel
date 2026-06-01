import type { NavigationEntry } from '../types/area';

export interface HierarchyState {
  currentName: string;
  currentLevel: number;
  currentAdcode: string;
  stack: NavigationEntry[];
}

export enum NavigationType {
  DrillDown = 'DrillDown',
  SiblingSwitch = 'SiblingSwitch',
  Back = 'Back',
}

const ROOT: HierarchyState = {
  currentName: '\u4E2D\u56FD',
  currentLevel: 0,
  currentAdcode: '100000',
  stack: [],
};

export function createInitialState(): HierarchyState {
  return { ...ROOT };
}

export function enterLevel(
  state: HierarchyState,
  name: string,
  level: number,
  adcode: string
): HierarchyState {
  if (level === state.currentLevel) {
    return {
      currentName: name,
      currentLevel: level,
      currentAdcode: adcode,
      stack: state.stack.filter((e) => e.level < level),
    };
  }
  if (level > state.currentLevel) {
    return {
      currentName: name,
      currentLevel: level,
      currentAdcode: adcode,
      stack: [
        ...state.stack,
        { name: state.currentName, level: state.currentLevel, adcode: state.currentAdcode },
      ],
    };
  }
  const targetIdx = state.stack.findIndex((e) => e.level === level);
  if (targetIdx >= 0) {
    return {
      currentName: name,
      currentLevel: level,
      currentAdcode: adcode,
      stack: state.stack.slice(0, targetIdx),
    };
  }
  return {
    currentName: name,
    currentLevel: level,
    currentAdcode: adcode,
    stack: [],
  };
}

export function replaceCurrentNode(
  state: HierarchyState,
  name: string,
  adcode: string
): HierarchyState {
  return {
    currentName: name,
    currentLevel: state.currentLevel,
    currentAdcode: adcode,
    stack: state.stack,
  };
}

export function leaveLevel(state: HierarchyState): HierarchyState | null {
  if (state.stack.length === 0) return null;
  const newStack = [...state.stack];
  const prev = newStack.pop()!;
  return {
    currentName: prev.name,
    currentLevel: prev.level,
    currentAdcode: prev.adcode,
    stack: newStack,
  };
}

export function jumpToLevel(
  state: HierarchyState,
  name: string,
  level: number,
  adcode: string
): HierarchyState {
  const idx = state.stack.findIndex((e) => e.adcode === adcode);
  if (idx >= 0) {
    return {
      currentName: name,
      currentLevel: level,
      currentAdcode: adcode,
      stack: state.stack.slice(0, idx),
    };
  }
  return enterLevel(state, name, level, adcode);
}

export function getBreadcrumb(state: HierarchyState): NavigationEntry[] {
  return [
    ...state.stack,
    { name: state.currentName, level: state.currentLevel, adcode: state.currentAdcode },
  ];
}

export function canGoBack(state: HierarchyState): boolean {
  return state.stack.length > 0;
}

export function getParent(state: HierarchyState): { name: string; level: number; adcode: string } | null {
  if (state.stack.length === 0) return null;
  return state.stack[state.stack.length - 1];
}

export function getPath(state: HierarchyState): string[] {
  return [...state.stack.map((e) => e.name), state.currentName];
}