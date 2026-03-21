import type { ContentManifestEntry } from "./contentManifest";

type PresentationMap = Record<string, { type: string }>;

type ValidationIssue = {
  key: string;
  message: string;
};

export function validateContentManifest(
  manifest: Record<string, ContentManifestEntry>,
  presentations: PresentationMap,
  fighterKeys: string[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  fighterKeys.forEach((key) => {
    const entry = manifest[key];
    if (!entry) {
      issues.push({ key, message: `Missing manifest entry for ${key}` });
      return;
    }

    if (!presentations[entry.presentationId]) {
      issues.push({ key, message: `Missing presentation '${entry.presentationId}' for ${key}` });
    }

    if (!entry.audioTheme) {
      issues.push({ key, message: `Missing audio theme for ${key}` });
    }

    if (entry.artStyle !== "procedural") {
      issues.push({ key, message: `Unsupported art style '${entry.artStyle}' for ${key}` });
    }
  });

  Object.keys(manifest).forEach((key) => {
    if (!fighterKeys.includes(key)) {
      issues.push({ key, message: `Manifest entry ${key} has no fighter tuning` });
    }
  });

  return issues;
}
