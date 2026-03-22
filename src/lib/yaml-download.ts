export function downloadYaml(
  yamlContent: string,
  filename = 'docker-compose.yml',
): void {
  const blob = new Blob([yamlContent], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyYaml(yamlContent: string): Promise<void> {
  await navigator.clipboard.writeText(yamlContent);
}
