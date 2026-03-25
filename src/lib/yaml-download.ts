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

export function shareOnTwitter(serviceCount: number): void {
  const text = `I just built a ${serviceCount}-service Docker Compose setup visually with @VCompose — no code, just drag & drop!\n\nTry it free:`;
  const url = 'https://vcompose.cc';
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
}
