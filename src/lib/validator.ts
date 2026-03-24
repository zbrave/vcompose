import type { AppStore, ValidationIssue } from '../store/types';
import { MAX_CANVAS_SERVICES, CANVAS_WARN_THRESHOLD } from '../store/types';

type ValidateInput = Pick<AppStore, 'nodes' | 'edges'>;

export function validate(store: ValidateInput): ValidationIssue[] {
  const { nodes, edges } = store;
  const issues: ValidationIssue[] = [];

  // Rule 5: No services
  if (nodes.length === 0) {
    issues.push({
      severity: 'warning',
      message: 'No services defined yet.',
    });
    return issues;
  }

  // Rule 6: Canvas service limit
  if (nodes.length >= MAX_CANVAS_SERVICES) {
    issues.push({
      severity: 'error',
      message: `Canvas limit reached (${MAX_CANVAS_SERVICES} services). Remove services before adding new ones.`,
    });
  } else if (nodes.length >= CANVAS_WARN_THRESHOLD) {
    issues.push({
      severity: 'warning',
      message: `${nodes.length}/${MAX_CANVAS_SERVICES} services on canvas. Performance may degrade.`,
    });
  }

  // Rule 1: service_name uniqueness
  const nameCount = new Map<string, string[]>();
  for (const node of nodes) {
    const name = node.data.serviceName;
    if (!nameCount.has(name)) {
      nameCount.set(name, []);
    }
    nameCount.get(name)!.push(node.id);
  }
  for (const [name, ids] of nameCount) {
    if (ids.length > 1) {
      for (const id of ids) {
        issues.push({
          severity: 'error',
          nodeId: id,
          field: 'serviceName',
          message: `Service name '${name}' is already used by another service.`,
        });
      }
    }
  }

  // Rule 2: depends_on reference validity
  for (const edge of edges) {
    const sourceExists = nodes.some((n) => n.id === edge.source);
    if (!sourceExists) {
      issues.push({
        severity: 'error',
        nodeId: edge.target,
        message: 'depends_on references a service that does not exist.',
      });
    }
  }

  // Per-node rules
  for (const node of nodes) {
    // Rule 4: Empty image
    if (!node.data.image) {
      issues.push({
        severity: 'warning',
        nodeId: node.id,
        field: 'image',
        message: `Image is not defined for service '${node.data.serviceName}'.`,
      });
    }

    // Rule 3: Port format
    for (const port of node.data.ports) {
      if (port.host && isNaN(Number(port.host))) {
        issues.push({
          severity: 'warning',
          nodeId: node.id,
          field: 'ports',
          message: `Port '${port.host}' is not a valid number.`,
        });
      }
      if (port.container && isNaN(Number(port.container))) {
        issues.push({
          severity: 'warning',
          nodeId: node.id,
          field: 'ports',
          message: `Port '${port.container}' is not a valid number.`,
        });
      }
    }
  }

  return issues;
}
