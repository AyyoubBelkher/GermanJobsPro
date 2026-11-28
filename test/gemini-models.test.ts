import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_GEMINI_MODEL,
  FALLBACK_MODELS,
  getActiveGeminiModelChain,
  isAuthError,
  isRateLimitError,
  generateContentWithFallback,
} from "../src/lib/gemini";

describe("Active Gemini 3.x Model Chain & Fallback Resilience", () => {
  it("uses the active Gemini 3.x fallback chain with zero deprecated 1.5/2.0/2.5 IDs", () => {
    const prevModel = process.env.GEMINI_MODEL;
    try {
      delete process.env.GEMINI_MODEL;
      const chain = getActiveGeminiModelChain();
      assert.deepEqual(chain, [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
      ]);
      assert.equal(DEFAULT_GEMINI_MODEL, "gemini-3.6-flash");

      for (const list of [chain, FALLBACK_MODELS]) {
        for (const modelId of list) {
          assert.equal(
            /^gemini-(1\.5|2\.0|2\.5)-/.test(modelId),
            false,
            `Deprecated model ID found in chain: ${modelId}`
          );
        }
      }
    } finally {
      if (prevModel === undefined) {
        delete process.env.GEMINI_MODEL;
      } else {
        process.env.GEMINI_MODEL = prevModel;
      }
    }
  });

  it("prepends and deduplicates process.env.GEMINI_MODEL when configured", () => {
    const prevModel = process.env.GEMINI_MODEL;
    try {
      process.env.GEMINI_MODEL = "gemini-3.8-flash";
      assert.deepEqual(getActiveGeminiModelChain(), [
        "gemini-3.8-flash",
        "gemini-3.5-flash-lite",
      ]);
    } finally {
      if (prevModel === undefined) {
        delete process.env.GEMINI_MODEL;
      } else {
        process.env.GEMINI_MODEL = prevModel;
      }
    }
  });

  it("contains zero gemini-1.5/2.0/2.5 model IDs across src/ (excluding generated)", () => {
    const srcRoot = path.resolve(process.cwd(), "src");
    const deprecatedPattern = /gemini-(1\.5|2\.0|2\.5)-[a-z0-9-]+/i;
    const filesToCheck: string[] = [];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "generated") continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
          filesToCheck.push(fullPath);
        }
      }
    };
    walk(srcRoot);

    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, "utf8");
      const match = content.match(deprecatedPattern);
      assert.equal(
        match,
        null,
        `Found deprecated model ID "${match?.[0]}" in ${path.relative(process.cwd(), filePath)}`
      );
    }
  });

  it("identifies 401/403 authentication errors and does not misclassify 429/500/503", () => {
    assert.equal(isAuthError({ status: 401, message: "Unauthorized" }), true);
    assert.equal(isAuthError({ status: 403, message: "ACCOUNT_STATE_INVALID" }), true);
    assert.equal(isAuthError(new Error("Request failed with status 401 UNAUTHENTICATED")), true);
    assert.equal(isAuthError(new Error("403 PERMISSION_DENIED: ACCOUNT_STATE_INVALID")), true);

    assert.equal(isAuthError({ status: 429, message: "RESOURCE_EXHAUSTED" }), false);
    assert.equal(isAuthError({ status: 500, message: "Internal Server Error" }), false);
    assert.equal(isAuthError({ status: 503, message: "Service Unavailable" }), false);
    assert.equal(isRateLimitError({ status: 429, message: "Too Many Requests" }), true);
  });

  it("fails fast on 401 authentication errors without retrying or trying fallback models", async () => {
    const prevModel = process.env.GEMINI_MODEL;
    delete process.env.GEMINI_MODEL;
    const calledModels: string[] = [];

    const mockAi = {
      models: {
        generateContent: async ({ model }: { model: string }) => {
          calledModels.push(model);
          const err = Object.assign(new Error("401 UNAUTHENTICATED"), { status: 401 });
          throw err;
        },
      },
    };

    try {
      await assert.rejects(
        () => generateContentWithFallback(mockAi, { contents: "test prompt" }, { retryDelayMs: 0 }),
        (err: Error) => err.message.includes("401")
      );
      assert.deepEqual(calledModels, ["gemini-3.6-flash"]);
    } finally {
      if (prevModel !== undefined) process.env.GEMINI_MODEL = prevModel;
    }
  });

  it("fails fast on 403 ACCOUNT_STATE_INVALID without retrying or trying fallback models", async () => {
    const prevModel = process.env.GEMINI_MODEL;
    delete process.env.GEMINI_MODEL;
    const calledModels: string[] = [];

    const mockAi = {
      models: {
        generateContent: async ({ model }: { model: string }) => {
          calledModels.push(model);
          const err = Object.assign(
            new Error("403 PERMISSION_DENIED: ACCOUNT_STATE_INVALID"),
            { status: 403 }
          );
          throw err;
        },
      },
    };

    try {
      await assert.rejects(
        () => generateContentWithFallback(mockAi, { contents: "test prompt" }, { retryDelayMs: 0 }),
        (err: Error) => err.message.includes("ACCOUNT_STATE_INVALID")
      );
      assert.deepEqual(calledModels, ["gemini-3.6-flash"]);
    } finally {
      if (prevModel !== undefined) process.env.GEMINI_MODEL = prevModel;
    }
  });

  it("retries 429 once and falls back across 503/500 transient errors through the 3.x chain", async () => {
    const prevModel = process.env.GEMINI_MODEL;
    delete process.env.GEMINI_MODEL;
    const calledModels: string[] = [];

    const mockAi = {
      models: {
        generateContent: async ({ model }: { model: string }) => {
          calledModels.push(model);
          if (model === "gemini-3.6-flash") {
            throw Object.assign(new Error("429 RESOURCE_EXHAUSTED"), { status: 429 });
          }
          if (model === "gemini-3.5-flash-lite") {
            throw Object.assign(new Error("503 Service Unavailable"), { status: 503 });
          }
          return { text: "Fallback response ok" };
        },
      },
    };

    try {
      const result = await generateContentWithFallback(
        mockAi,
        { contents: "test prompt" },
        { retryDelayMs: 0 }
      );
      assert.equal(result, "Fallback response ok");
      assert.deepEqual(calledModels, [
        "gemini-3.6-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
      ]);
    } finally {
      if (prevModel !== undefined) process.env.GEMINI_MODEL = prevModel;
    }
  });
});
