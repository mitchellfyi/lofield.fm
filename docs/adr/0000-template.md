# ADR 0000: Title (Template)

**Status**: [Proposed | Accepted | Deprecated | Superseded by ADR-XXXX]  
**Date**: YYYY-MM-DD  
**Deciders**: [Team, Role, or Name]  
**Related**: [Link to issue, spec, or other ADR]

## Context

Describe the problem or situation that requires a decision. Include:

- **Background**: What led to this decision?
- **Current state**: What's the problem with how things work now?
- **Constraints**: What limitations or requirements do we have?
- **Stakeholders**: Who is affected by this decision?

### Example Questions to Answer

- What forces are at play?
- What's broken or missing?
- Why do we need to decide now?
- What happens if we don't decide?

## Decision

State the decision clearly and concisely.

- **What**: Exactly what are we deciding to do?
- **How**: How will we implement this?
- **Why**: Why this approach?

### Example Structure

We will [action] by [method] in order to [outcome].

**Example**: We will store user API keys in Supabase Vault by using encrypted secrets and server-side access in order to ensure keys never reach the browser.

## Alternatives Considered

List at least 2-3 alternatives considered, even if they were quickly rejected.

### Option 1: [Name]

**Pros**:

- Advantage 1
- Advantage 2

**Cons**:

- Disadvantage 1
- Disadvantage 2

**Why rejected**: Brief reason

### Option 2: [Name]

**Pros**:

- Advantage 1
- Advantage 2

**Cons**:

- Disadvantage 1
- Disadvantage 2

**Why rejected or selected**: Brief reason

## Consequences

Describe the impact of this decision.

### Positive

1. Benefit 1
2. Benefit 2
3. Benefit 3

### Negative

1. Trade-off 1
2. Trade-off 2
3. Trade-off 3

### Neutral

1. Neutral impact 1
2. Neutral impact 2

## Implementation

How will this decision be implemented?

### Steps

1. Step 1
2. Step 2
3. Step 3

### Timeline

- **Phase 1**: Description (date)
- **Phase 2**: Description (date)

### Success Criteria

- Metric 1: How to measure
- Metric 2: How to measure

## Notes

Optional section for:

- Open questions
- Future considerations
- Dependencies on other decisions
- Follow-up actions

## Related Documentation

- [Back to Index](../INDEX.md)
- [Related Doc 1](./path/to/doc.md)
- [Related Doc 2](./path/to/doc.md)

## Relevant Code

- `/path/to/implementation/file.ts` - Description
- `/path/to/related/file.sql` - Description
