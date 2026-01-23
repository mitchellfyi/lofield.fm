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
 * Finds patterns like:
 *   new Tone.Sequence((time, note) => {
 *     synth.triggerAttackRelease(note, "8n", time);
 *   }, [...], "8n")
 *
 * And injects:
 *   new Tone.Sequence((time, note) => {
 *     window.__vizTrigger?.(42, note, "note");
 *     synth.triggerAttackRelease(note, "8n", time);
 *   }, [...], "8n")
 */
export function transformCode(source: string): TransformResult {
  const lines = source.split('\n');
  const transformedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1; // 1-indexed

    // Check if this line starts a Tone.Sequence, Tone.Pattern, or Tone.Loop callback
    const transformedLine = injectTriggerIfNeeded(line, lineNumber, lines, i);
    transformedLines.push(transformedLine);
  }

  return {
    code: transformedLines.join('\n'),
  };
}

/**
 * Check if a line contains a callback definition that should be instrumented
 */
function injectTriggerIfNeeded(
  line: string,
  lineNumber: number,
  _allLines: string[],
  _lineIndex: number
): string {
  // Match Tone.Sequence/Pattern/Loop with arrow function callback
  // e.g., "new Tone.Sequence((time, note) => {"
  // or "new Tone.Loop((time) => {"
  const sequencePattern = /^(\s*)(.*new\s+Tone\.(Sequence|Pattern|Loop)\s*\(\s*\()([\w,\s]*)\)\s*=>\s*\{(.*)$/;
  const match = line.match(sequencePattern);

  if (match) {
    const indent = match[1];
    const prefix = match[2];
    const params = match[4];
    const rest = match[5];

    // Extract note parameter if present (second param for Sequence/Pattern)
    const paramList = params.split(',').map(p => p.trim());
    const noteParam = paramList.length > 1 ? paramList[1] : 'null';

    // Inject trigger call at the start of the callback body
    const triggerCall = `window.__vizTrigger?.(${lineNumber}, ${noteParam}, "note");`;

    // If there's already code after the {, put trigger before it
    if (rest.trim()) {
      return `${indent}${prefix}${params}) => { ${triggerCall} ${rest}`;
    }
    return `${indent}${prefix}${params}) => { ${triggerCall}`;
  }

  // Match triggerAttackRelease calls directly (for simpler patterns)
  // e.g., "synth.triggerAttackRelease("C4", "8n", time);"
  const triggerPattern = /^(\s*)(\w+)\.(triggerAttackRelease|triggerAttack)\s*\(\s*["']?([A-G]#?\d?)["']?/;
  const triggerMatch = line.match(triggerPattern);

  if (triggerMatch) {
    const indent = triggerMatch[1];
    const note = triggerMatch[4] || 'null';
    // Inject trigger before the line
    return `${indent}window.__vizTrigger?.(${lineNumber}, "${note}", "note"); ${line.trim()}`;
  }

  return line;
}

/**
 * Simple version that just wraps the entire code with a try-catch
 * and adds visualization setup at the start
 */
export function wrapCodeForVisualization(code: string): string {
  // First transform to inject triggers
  const { code: transformedCode } = transformCode(code);

  return transformedCode;
}
