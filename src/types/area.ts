declare global {
  interface Window {
    AMap: any;
  }
}

export interface AreaNode {
  name: string;
  level: number;
  parentName: string | null;
  adcode: string;
  children: string[];
  center?: [number, number];
}

export interface NavigationEntry {
  name: string;
  level: number;
  adcode: string;
}

export interface TooltipInfo {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  visited: boolean;
  totalChildren: number;
  visitedChildren: number;
}

export interface VisitedData {
  [name: string]: boolean;
}

export type MapLevel = 'country' | 'province' | 'city' | 'district';