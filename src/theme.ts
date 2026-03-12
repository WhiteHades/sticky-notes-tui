import { RGBA } from "@opentui/core";

export const theme = {
  base: "#1e1e2e",
  mantle: "#181825",
  crust: "#11111b",
  surface0: "#313244",
  surface1: "#45475a",
  surface2: "#585b70",
  overlay0: "#6c7086",
  overlay1: "#7f849c",
  overlay2: "#9399b2",
  subtext0: "#a6adc8",
  subtext1: "#bac2de",
  text: "#cdd6f4",
  rosewater: "#f5e0dc",
  flamingo: "#f2cdcd",
  pink: "#f5c2e7",
  mauve: "#cba6f7",
  red: "#f38ba8",
  peach: "#fab387",
  yellow: "#f9e2af",
  green: "#a6e3a1",
  teal: "#94e2d5",
  sky: "#89dceb",
  blue: "#89b4fa",
  lavender: "#b4befe",
} as const;

export const notePalette = [
  theme.rosewater,
  theme.flamingo,
  theme.pink,
  theme.mauve,
  theme.yellow,
  theme.green,
  theme.teal,
  theme.sky,
  theme.lavender,
] as const;

export const overlayColour = RGBA.fromValues(0.12, 0.12, 0.18, 0.8);
