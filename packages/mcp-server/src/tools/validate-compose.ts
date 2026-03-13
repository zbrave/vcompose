import { parseYaml } from '../../../../src/lib/yaml-parser';
import { validate } from '../../../../src/lib/validator';

export interface ValidateComposeInput {
  yaml: string;
}

export interface ValidateComposeOutput {
  valid: boolean;
  issues: Array<{ severity: string; message: string; field?: string }>;
  services: string[];
}

export async function handleValidateCompose(
  input: ValidateComposeInput,
): Promise<ValidateComposeOutput> {
  const { yaml } = input;
  const parseResult = parseYaml(yaml);

  if (!parseResult.success) {
    return {
      valid: false,
      issues: parseResult.errors.map((e) => ({ severity: 'error', message: e })),
      services: [],
    };
  }

  const validationIssues = validate({
    nodes: parseResult.nodes,
    edges: parseResult.edges,
  });

  const hasErrors = validationIssues.some((i) => i.severity === 'error');
  const services = parseResult.nodes.map((n) => n.data.serviceName);

  return {
    valid: !hasErrors,
    issues: validationIssues.map((i) => ({
      severity: i.severity,
      message: i.message,
      ...(i.field && { field: i.field }),
    })),
    services,
  };
}
