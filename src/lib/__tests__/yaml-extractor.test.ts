import { describe, it, expect } from 'vitest';
import { extractYaml } from '../ai/yaml-extractor';

describe('extractYaml', () => {
  it('extracts YAML from ```yaml code block', () => {
    const response = 'Here is the compose:\n```yaml\nversion: "3.8"\nservices:\n  web:\n    image: nginx\n```\nDone!';
    expect(extractYaml(response)).toBe('version: "3.8"\nservices:\n  web:\n    image: nginx');
  });

  it('extracts YAML from ``` code block without language', () => {
    const response = 'Result:\n```\nversion: "3.8"\nservices:\n  db:\n    image: postgres\n```';
    expect(extractYaml(response)).toBe('version: "3.8"\nservices:\n  db:\n    image: postgres');
  });

  it('returns full text when no code block found', () => {
    const response = 'version: "3.8"\nservices:\n  web:\n    image: nginx';
    expect(extractYaml(response)).toBe(response);
  });

  it('returns empty string for empty input', () => {
    expect(extractYaml('')).toBe('');
  });

  it('extracts first code block when multiple exist', () => {
    const response = '```yaml\nfirst: true\n```\n```yaml\nsecond: true\n```';
    expect(extractYaml(response)).toBe('first: true');
  });
});
