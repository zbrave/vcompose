import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadYaml, copyYaml } from '../yaml-download';

describe('yaml-download', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadYaml', () => {
    it('creates a blob URL and triggers download', () => {
      const createObjectURL = vi.fn(() => 'blob:test');
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      const link = { href: '', download: '', click: vi.fn() };
      const createElement = vi.fn(() => link);
      global.document = { createElement } as unknown as Document;

      downloadYaml('version: "3.8"');

      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(link.download).toBe('docker-compose.yml');
      expect(link.click).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('uses custom filename when provided', () => {
      const createObjectURL = vi.fn(() => 'blob:test');
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      const link = { href: '', download: '', click: vi.fn() };
      const createElement = vi.fn(() => link);
      global.document = { createElement } as unknown as Document;

      downloadYaml('version: "3.8"', 'my-compose.yml');
      expect(link.download).toBe('my-compose.yml');
    });
  });

  describe('copyYaml', () => {
    it('copies text to clipboard', async () => {
      const writeText = vi.fn(() => Promise.resolve());
      Object.defineProperty(global, 'navigator', {
        value: { clipboard: { writeText } },
        writable: true,
        configurable: true,
      });

      await copyYaml('version: "3.8"');
      expect(writeText).toHaveBeenCalledWith('version: "3.8"');
    });
  });
});
