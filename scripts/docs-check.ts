#!/usr/bin/env node
/**
 * Documentation structure and cross-linking validator
 * 
 * Validates:
 * 1. Required documentation files exist
 * 2. INDEX.md contains links to all required docs
 * 3. Each doc contains "Related Documentation" or "Related docs" heading
 * 4. Each doc links back to INDEX.md
 * 5. Local relative links point to existing files
 */

import * as fs from "fs";
import * as path from "path";

const DOCS_DIR = path.resolve(__dirname, "../docs");
const INDEX_PATH = path.join(DOCS_DIR, "INDEX.md");

// Required documentation files based on INDEX.md structure
const REQUIRED_DOCS = [
  // Setup & Getting Started
  "setup/QUICKSTART.md",
  "setup/ENV_VARS.md",
  "setup/SUPABASE.md",

  // Architecture & Design
  "architecture/OVERVIEW.md",
  "architecture/DATA_MODEL.md",
  "architecture/DATA_FLOW.md",
  "architecture/FLOWS.md",
  "architecture/DECISIONS.md",

  // Security
  "security/SECURITY_MODEL.md",
  "security/SECRETS.md",
  "security/RLS.md",
  "security/STORAGE.md",

  // Provider Integrations
  "providers/OPENAI.md",
  "providers/ELEVENLABS.md",

  // Usage & Costs
  "usage/USAGE_MODEL.md",
  "usage/TRACKING.md",
  "usage/USAGE_UI.md",
  "usage/COSTS.md",
  "usage/PRICING.md",

  // Operations & Runbook
  "runbook/TROUBLESHOOTING.md",
  "runbook/COMMON_FAILURES.md",
  "runbook/INCIDENTS.md",
  "runbook/RELEASES.md",

  // Agent Guidelines
  "agents/AGENT_PLAYBOOK.md",
  "agents/REPO_GOTCHAS.md",
  "agents/CHANGE_TYPES.md",

  // ADRs
  "adr/0000-template.md",
  "adr/0001-documentation-architecture.md",
  "adr/0001-supabase-rls-and-vault.md",
  "adr/0002-usage-events-and-cost-model.md",
  "adr/0003-vercel-deploy-strategy.md",
];

interface ValidationError {
  file: string;
  type: string;
  message: string;
}

const errors: ValidationError[] = [];

function addError(file: string, type: string, message: string): void {
  errors.push({ file, type, message });
}

function checkFileExists(relativePath: string): boolean {
  const fullPath = path.join(DOCS_DIR, relativePath);
  return fs.existsSync(fullPath);
}

function readFile(relativePath: string): string {
  const fullPath = path.join(DOCS_DIR, relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

function extractMarkdownLinks(content: string): Array<{ text: string; href: string }> {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: Array<{ text: string; href: string }> = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      href: match[2],
    });
  }

  return links;
}

function isRelativeDocLink(href: string): boolean {
  // Relative doc links start with ./ or ../ or are just a path
  // Exclude external links (http://, https://, mailto:, #anchors)
  return !href.startsWith("http://") &&
    !href.startsWith("https://") &&
    !href.startsWith("mailto:") &&
    !href.startsWith("#");
}

function checkRequiredFilesExist(): void {
  console.log("✓ Checking required documentation files exist...");
  
  for (const docPath of REQUIRED_DOCS) {
    if (!checkFileExists(docPath)) {
      addError(docPath, "missing-file", `Required documentation file does not exist`);
    }
  }
}

function checkIndexContainsAllDocs(): void {
  console.log("✓ Checking INDEX.md contains links to all required docs...");
  
  if (!checkFileExists("INDEX.md")) {
    addError("INDEX.md", "missing-file", "INDEX.md does not exist");
    return;
  }

  const indexContent = readFile("INDEX.md");
  const links = extractMarkdownLinks(indexContent);

  for (const docPath of REQUIRED_DOCS) {
    // Check if the doc is linked in INDEX.md
    // Links can be relative (./path) or absolute from docs root
    const possibleLinks = [
      `./${docPath}`,
      `../${docPath}`,
      docPath,
    ];

    const isLinked = links.some(link => 
      possibleLinks.some(possible => link.href.includes(possible))
    );

    if (!isLinked) {
      addError("INDEX.md", "missing-link", `INDEX.md does not contain a link to ${docPath}`);
    }
  }
}

function checkDocHasRelatedSection(docPath: string): void {
  const content = readFile(docPath);
  
  // Check for "Related Documentation" or "Related docs" heading
  const hasRelatedHeading = /^##\s+(Related Documentation|Related docs|Related Docs)/im.test(content);
  
  if (!hasRelatedHeading) {
    addError(
      docPath,
      "missing-related-section",
      `Document does not contain "Related Documentation" or "Related docs" heading`
    );
  }
}

function checkDocLinksBackToIndex(docPath: string): void {
  const content = readFile(docPath);
  const links = extractMarkdownLinks(content);

  // Check if any link points back to INDEX.md
  const hasIndexLink = links.some(link => {
    const href = link.href.toLowerCase();
    return href.includes("index.md") || 
           href === "../INDEX.md" ||
           href === "./INDEX.md" ||
           href === "INDEX.md";
  });

  if (!hasIndexLink) {
    addError(
      docPath,
      "missing-index-link",
      `Document does not contain a link back to INDEX.md`
    );
  }
}

function checkLocalLinksExist(docPath: string): void {
  const content = readFile(docPath);
  const links = extractMarkdownLinks(content);
  const docDir = path.dirname(path.join(DOCS_DIR, docPath));

  for (const link of links) {
    if (!isRelativeDocLink(link.href)) {
      continue;
    }

    // Remove anchor fragments
    const cleanHref = link.href.split("#")[0];
    if (!cleanHref) continue; // Pure anchor link

    // Resolve the link relative to the document's directory
    const linkedPath = path.resolve(docDir, cleanHref);
    
    // Check if it exists
    if (!fs.existsSync(linkedPath)) {
      addError(
        docPath,
        "broken-link",
        `Broken link: "${link.text}" points to ${link.href} which does not exist`
      );
    }
  }
}

function checkIndividualDocs(): void {
  console.log("✓ Checking individual documentation files...");
  
  for (const docPath of REQUIRED_DOCS) {
    if (!checkFileExists(docPath)) {
      continue; // Already reported as missing
    }

    checkDocHasRelatedSection(docPath);
    checkDocLinksBackToIndex(docPath);
    
    // Skip broken link check for templates (they have placeholder links)
    if (!docPath.includes("template")) {
      checkLocalLinksExist(docPath);
    }
  }

  // Also check INDEX.md itself for broken links
  if (checkFileExists("INDEX.md")) {
    checkLocalLinksExist("INDEX.md");
  }
}

function checkVerifyCommandMentioned(): void {
  console.log("✓ Checking docs mention the verify command...");
  
  // Check key docs that should mention pnpm verify
  const keyDocs = [
    "agents/AGENT_PLAYBOOK.md",
    "setup/QUICKSTART.md",
  ];

  for (const docPath of keyDocs) {
    if (!checkFileExists(docPath)) continue;
    
    const content = readFile(docPath);
    if (!content.includes("pnpm verify") && !content.includes("`verify`")) {
      addError(
        docPath,
        "missing-verify-mention",
        `Document should mention the "pnpm verify" command`
      );
    }
  }
}

function printResults(): void {
  if (errors.length === 0) {
    console.log("\n✅ All documentation checks passed!");
    console.log(`   - ${REQUIRED_DOCS.length} required files exist`);
    console.log("   - INDEX.md contains all required links");
    console.log("   - All docs have 'Related Documentation' sections");
    console.log("   - All docs link back to INDEX.md");
    console.log("   - All local links are valid");
    return;
  }

  console.error("\n❌ Documentation validation failed!\n");

  // Group errors by type
  const errorsByType: Record<string, ValidationError[]> = {};
  for (const error of errors) {
    if (!errorsByType[error.type]) {
      errorsByType[error.type] = [];
    }
    errorsByType[error.type].push(error);
  }

  // Print grouped errors
  const typeLabels: Record<string, string> = {
    "missing-file": "Missing Required Files",
    "missing-link": "Missing Links in INDEX.md",
    "missing-related-section": "Missing 'Related Documentation' Section",
    "missing-index-link": "Missing Link Back to INDEX.md",
    "broken-link": "Broken Links",
    "missing-verify-mention": "Missing 'pnpm verify' Mention",
  };

  for (const [type, typeErrors] of Object.entries(errorsByType)) {
    console.error(`\n${typeLabels[type] || type}:`);
    for (const error of typeErrors) {
      console.error(`  ❌ ${error.file}: ${error.message}`);
    }
  }

  console.error(`\n${errors.length} error(s) found.\n`);
  process.exit(1);
}

function main(): void {
  console.log("📚 Validating documentation structure and links...\n");

  checkRequiredFilesExist();
  checkIndexContainsAllDocs();
  checkIndividualDocs();
  checkVerifyCommandMentioned();

  printResults();
}

main();
