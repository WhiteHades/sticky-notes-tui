import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";

import { App } from "./App";

const renderer = await createCliRenderer({
  exitOnCtrlC: false,
  targetFps: 60,
  useMouse: true,
});

createRoot(renderer).render(<App />);
