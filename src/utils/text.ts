export function truncateText(value: string, width: number): string {
  if (width <= 0) {
    return "";
  }

  if (value.length <= width) {
    return value;
  }

  if (width <= 3) {
    return value.slice(0, width);
  }

  return `${value.slice(0, width - 3)}...`;
}

export function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function wrapText(value: string, width: number): string[] {
  if (width <= 1) {
    return value.length > 0 ? value.split("") : [""];
  }

  const wrapped: string[] = [];

  for (const rawLine of value.replace(/\r\n/g, "\n").split("\n")) {
    if (rawLine.trim().length === 0) {
      wrapped.push("");
      continue;
    }

    let current = "";

    for (const word of rawLine.split(/\s+/)) {
      if (word.length > width) {
        if (current) {
          wrapped.push(current);
          current = "";
        }

        let remaining = word;
        while (remaining.length > width) {
          wrapped.push(remaining.slice(0, width));
          remaining = remaining.slice(width);
        }

        current = remaining;
        continue;
      }

      if (!current) {
        current = word;
        continue;
      }

      if (current.length + 1 + word.length <= width) {
        current = `${current} ${word}`;
        continue;
      }

      wrapped.push(current);
      current = word;
    }

    if (current) {
      wrapped.push(current);
    }
  }

  return wrapped.length > 0 ? wrapped : [""];
}
