import type { ReactNode } from "react";

import { overlayColour, theme } from "../theme";

export interface ModalFrameProps {
  title: string;
  accent: string;
  width: number | "auto" | `${number}%`;
  height?: number | "auto" | `${number}%`;
  children: ReactNode;
}

export function ModalFrame({ title, accent, width, height, children }: ModalFrameProps) {
  return (
    <box
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      left={0}
      zIndex={50}
      justifyContent="center"
      alignItems="center"
      backgroundColor={overlayColour}
    >
      <box
        width={width}
        height={height}
        border
        borderStyle="rounded"
        borderColor={accent}
        backgroundColor={theme.crust}
        flexDirection="column"
        title={title}
      >
        {children}
      </box>
    </box>
  );
}
