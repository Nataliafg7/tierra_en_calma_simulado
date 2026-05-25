export function logA11yViolations(violations) {
  if (!violations || violations.length === 0) {
    return;
  }

  cy.task('log', `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} detected`);
  cy.task(
    'table',
    violations.map(({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
      target: nodes[0]?.target?.join(', ') || '',
      html: nodes[0]?.html || ''
    }))
  );
}
