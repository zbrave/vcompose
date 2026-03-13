import { describe, it, expect } from 'vitest';
import { handleValidateCompose } from '../src/tools/validate-compose';

describe('handleValidateCompose', () => {
  it('validates correct YAML', async () => {
    const yaml = `
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
`;
    const result = await handleValidateCompose({ yaml });
    expect(result.valid).toBe(true);
    expect(result.services).toContain('postgres');
  });

  it('returns parse errors for invalid YAML', async () => {
    const result = await handleValidateCompose({ yaml: '{{invalid yaml' });
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('detects semantic errors', async () => {
    const yaml = `
version: "3.8"
services:
  myapp:
    image: ""
`;
    const result = await handleValidateCompose({ yaml });
    expect(result.issues.some((i) => i.severity === 'warning')).toBe(true);
  });

  it('lists service names', async () => {
    const yaml = `
version: "3.8"
services:
  web:
    image: nginx
  db:
    image: postgres
`;
    const result = await handleValidateCompose({ yaml });
    expect(result.services).toContain('web');
    expect(result.services).toContain('db');
  });
});
