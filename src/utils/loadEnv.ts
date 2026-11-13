import fs from "node:fs";
import path from "node:path";

const ENV_LINE_PATTERN = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

const parseValue = (raw: string): string => {
  let value = raw.trim();

  if (!/^["']/.test(value)) {
    const commentIndex = value.indexOf(" #");

    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim();
    }
  }

  const quote = value[0];

  if (
    (quote === '"' || quote === "'") &&
    value.length >= 2 &&
    value.endsWith(quote)
  ) {
    value = value.slice(1, -1);
  }

  return value;
};

export const loadEnv = (envFilePath = path.join(process.cwd(), ".env")): void => {
  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const content = fs.readFileSync(envFilePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const match = ENV_LINE_PATTERN.exec(line);

    if (!match) {
      continue;
    }

    const key = match[1];

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = parseValue(match[2] ?? "");
  }
};
