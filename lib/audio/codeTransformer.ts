/**
 * Code Transformer - Injects visualization trigger calls into user code
 *
 * Transforms Tone.Sequence/Pattern/Loop callbacks to emit trigger events
 * that map back to source code line numbers for highlighting.
 */

export interface TransformResult {
  code: string;
}

/**
 * Transform user code to inject visualization triggers
 *
 * Handles both block-body and expression-body arrow functions:
 *
 * Block body:
 *   new Tone.Sequence((time, note) => {
 *     synth.triggerAttackRelease(note, "8n", time);
 *   }, [...], "8n")
 *
 * Expression body (common in compact code):
 *   new Tone.Sequence((t, v) => v && synth.triggerAttackRelease("C1", "8n", t, v), [...], "8n")
 */
export function transformCode(source: string): TransformResult {
  const lines = source.split("\n");
  const transformedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    transformedLines.push(transformLine(line, lineNumber));
  }

  return { code: transformedLines.join("\n") };
}

/**
 * Transform a single line of code
 */
function transformLine(line: string, lineNumber: number): string {
  // Pattern 1: Block-body arrow functions in Sequence/Pattern/Loop
  // new Tone.Sequence((time, note) => { ... }, ...)
  const blockBodyMatch = line.match(
    /(new\s+Tone\.(Sequence|Pattern|Loop)\s*\(\s*\()([^)]*)\)\s*=>\s*\{/
  );

  if (blockBodyMatch) {
    const [fullMatch, prefix, , params] = blockBodyMatch;
    const paramList = params.split(",").map((p) => p.trim());
    const noteParam = paramList.length > 1 ? paramList[1] : "null";
    const triggerCall = `window.__vizTrigger?.(${lineNumber}, ${noteParam}, "note"); `;

    return line.replace(fullMatch, `${prefix}${params}) => { ${triggerCall}`);
  }

  // Pattern 2: Expression-body arrow functions in Sequence/Pattern/Loop
  // new Tone.Sequence((t, v) => v && ..., [...], "8n")
  // Match the arrow function start, then find where the expression ends (before ", [")
  const expressionStartMatch = line.match(
    /(new\s+Tone\.(Sequence|Pattern|Loop)\s*\(\s*\()([^)]*)\)\s*=>\s*(?!\{)/
  );

  if (expressionStartMatch) {
    const [fullMatch, prefix, , params] = expressionStartMatch;
    const matchIndex = line.indexOf(fullMatch);
    const afterArrow = line.slice(matchIndex + fullMatch.length);

    // Find where the expression ends (at comma or end of line)
    const expressionEnd = findExpressionEnd(afterArrow);
    if (expressionEnd > 0) {
      const expression = afterArrow.slice(0, expressionEnd);
      const rest = afterArrow.slice(expressionEnd);

      const paramList = params.split(",").map((p) => p.trim());
      const noteParam = paramList.length > 1 ? paramList[1] : "null";
      const triggerCall = `window.__vizTrigger?.(${lineNumber}, ${noteParam}, "note"); `;

      // Convert expression body to block body with trigger
      const before = line.slice(0, matchIndex);
      // rest starts with comma if it was found, or is empty if expression went to end of line
      const closeBrace = rest.startsWith(",") ? " }" : " };";
      const transformed = `${prefix}${params}) => { ${triggerCall}${expression.trim()};${closeBrace}${rest}`;
      return before + transformed;
    }
  }

  return line;
}

/**
 * Find where the expression body ends by looking for a comma at depth 0
 * This handles both ", [" on same line and multi-line where [ is on next line
 */
function findExpressionEnd(str: string): number {
  let parenDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : "";

    // Handle string literals
    if ((char === '"' || char === "'" || char === "`") && prevChar !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (inString) continue;

    // Track nesting
    if (char === "(") parenDepth++;
    else if (char === ")") parenDepth--;
    else if (char === "[") bracketDepth++;
    else if (char === "]") bracketDepth--;

    // Look for comma at depth 0 (the array argument separator)
    // This is the end of the expression body
    if (parenDepth === 0 && bracketDepth === 0 && char === ",") {
      return i;
    }
  }

  // If no comma found, expression continues to end of line
  // Return the length to capture everything (for multi-line cases)
  return str.length;
}

/**
 * Wrapper for visualization
 */
export function wrapCodeForVisualization(code: string): string {
  const { code: transformedCode } = transformCode(code);
  return transformedCode;
}
