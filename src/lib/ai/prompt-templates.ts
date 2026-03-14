export const GENERATE_SYSTEM_PROMPT = `You are a Docker Compose expert. Generate valid docker-compose.yml files.
Rules:
- Use version "3.8"
- Use specific image tags (not :latest)
- Add appropriate environment variables
- Set up depends_on relationships
- Return ONLY the YAML inside a \`\`\`yaml code block, no explanations.`;

export const OPTIMIZE_SYSTEM_PROMPT = `You are a Docker Compose expert. Optimize docker-compose.yml files.
Rules:
- Apply Docker best practices
- Add healthchecks where appropriate
- Optimize resource usage
- Fix any issues
- Return ONLY the optimized YAML inside a \`\`\`yaml code block, no explanations.`;

export function buildGeneratePrompt(userPrompt: string): string {
  return userPrompt;
}

export function buildOptimizePrompt(existingYaml: string, userPrompt: string): string {
  return `Current docker-compose.yml:\n${existingYaml}\n\nOptimization request: ${userPrompt}`;
}
