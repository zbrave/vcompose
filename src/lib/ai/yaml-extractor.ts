export function extractYaml(response: string): string {
  if (!response) return '';

  // Try ```yaml ... ``` first
  const yamlMatch = response.match(/```yaml\n([\s\S]*?)```/);
  if (yamlMatch) return yamlMatch[1].trim();

  // Try ``` ... ``` without language
  const codeMatch = response.match(/```\n([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1].trim();

  // Return full text as fallback
  return response;
}
