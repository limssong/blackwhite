import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TILES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export type Tile = (typeof TILES)[number];

export function isBlack(tile: Tile): boolean {
  return tile % 2 === 0;
}

export function getTileColor(tile: Tile): "black" | "white" {
  return isBlack(tile) ? "black" : "white";
}
