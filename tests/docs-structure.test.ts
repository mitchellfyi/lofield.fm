import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const DOCS_DIR = path.resolve(__dirname, "../docs");
const INDEX_PATH = path.join(DOCS_DIR, "INDEX.md");

describe("Documentation structure", () => {
  it("INDEX.md exists", () => {
    expect(fs.existsSync(INDEX_PATH)).toBe(true);
  });

  it("all required documentation files exist", () => {
    const requiredDocs = [
      "setup/QUICKSTART.md",
      "setup/ENV_VARS.md",
      "setup/SUPABASE.md",
      "architecture/OVERVIEW.md",
      "architecture/DATA_MODEL.md",
      "architecture/DATA_FLOW.md",
      "architecture/FLOWS.md",
      "architecture/DECISIONS.md",
      "security/SECURITY_MODEL.md",
      "security/SECRETS.md",
      "security/RLS.md",
      "security/STORAGE.md",
      "providers/OPENAI.md",
      "providers/ELEVENLABS.md",
      "usage/USAGE_MODEL.md",
      "usage/TRACKING.md",
      "usage/USAGE_UI.md",
      "usage/COSTS.md",
      "usage/PRICING.md",
      "runbook/TROUBLESHOOTING.md",
      "runbook/COMMON_FAILURES.md",
      "runbook/INCIDENTS.md",
      "runbook/RELEASES.md",
      "agents/AGENT_PLAYBOOK.md",
      "agents/REPO_GOTCHAS.md",
      "agents/CHANGE_TYPES.md",
      "adr/0000-template.md",
      "adr/0001-documentation-architecture.md",
      "adr/0001-supabase-rls-and-vault.md",
      "adr/0002-usage-events-and-cost-model.md",
      "adr/0003-vercel-deploy-strategy.md",
    ];

    const missing: string[] = [];
    for (const doc of requiredDocs) {
      const fullPath = path.join(DOCS_DIR, doc);
      if (!fs.existsSync(fullPath)) {
        missing.push(doc);
      }
    }

    expect(missing).toHaveLength(0);
  });

  it("INDEX.md contains links to key documentation", () => {
    const indexContent = fs.readFileSync(INDEX_PATH, "utf-8");
    
    const keyDocs = [
      "QUICKSTART.md",
      "AGENT_PLAYBOOK.md",
      "SECURITY_MODEL.md",
      "OVERVIEW.md",
    ];

    for (const doc of keyDocs) {
      expect(indexContent).toContain(doc);
    }
  });

  it("each documentation file has a Related Documentation section", () => {
    const sampleDocs = [
      "agents/AGENT_PLAYBOOK.md",
      "security/SECURITY_MODEL.md",
      "setup/QUICKSTART.md",
    ];

    for (const doc of sampleDocs) {
      const fullPath = path.join(DOCS_DIR, doc);
      if (!fs.existsSync(fullPath)) continue;
      
      const content = fs.readFileSync(fullPath, "utf-8");
      const hasRelatedSection = /^##\s+(Related Documentation|Related docs|Related Docs)/im.test(content);
      
      expect(hasRelatedSection).toBe(true);
    }
  });

  it("documentation files link back to INDEX.md", () => {
    const sampleDocs = [
      "agents/AGENT_PLAYBOOK.md",
      "security/SECURITY_MODEL.md",
      "setup/QUICKSTART.md",
    ];

    for (const doc of sampleDocs) {
      const fullPath = path.join(DOCS_DIR, doc);
      if (!fs.existsSync(fullPath)) continue;
      
      const content = fs.readFileSync(fullPath, "utf-8");
      const hasIndexLink = content.toLowerCase().includes("index.md");
      
      expect(hasIndexLink).toBe(true);
    }
  });

  it("key docs mention pnpm verify", () => {
    const keyDocs = [
      "agents/AGENT_PLAYBOOK.md",
      "setup/QUICKSTART.md",
    ];

    for (const doc of keyDocs) {
      const fullPath = path.join(DOCS_DIR, doc);
      if (!fs.existsSync(fullPath)) continue;
      
      const content = fs.readFileSync(fullPath, "utf-8");
      const mentionsVerify = content.includes("pnpm verify") || content.includes("`verify`");
      
      expect(mentionsVerify).toBe(true);
    }
  });
});
