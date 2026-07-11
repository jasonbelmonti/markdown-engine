import { describe, expect, it, vi } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type ValidationProfile,
} from "../src/index.js";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";
import {
  closeProfileDataTree,
  DATA_CLOSURE_FAILED,
} from "../src/declarative-validation/profile/data-closure.js";
import { deeplyNestedMalformedYaml } from "./support/yaml-test-support.js";

const supportedSyntaxVersion = "markdown-engine.validation@v1" as const;
const sharedDagDepth = 18;
const sharedDagDescriptorReadsPerClosure = sharedDagDepth * 2;

describe("declarative validation profile containment", () => {
  it("returns a bounded diagnostic when malformed YAML exhausts parser recursion", () => {
    const profileYaml = `syntaxVersion: markdown-engine.validation@v1
rules:
  - id: deep.yaml
    select: { target: document }
    assert:
      text:
        contains:
${deeplyNestedMalformedYaml(2_000, 8)}`;

    const result = parseValidationProfile(profileYaml);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidYaml",
        severity: "error",
      }),
    );
  });

  it("rejects excessively deep direct profile data without overflowing the stack", () => {
    const profile = profileWithNestedContains(5_000);

    const parseResult = parseValidationProfile(
      profile as Parameters<typeof parseValidationProfile>[0],
    );
    const validationResult = validateWithProfile(normalizedDocument(), profile);
    const compileResult = compileValidationProfile(profile);

    expect(parseResult.profile).toBeUndefined();
    expect(parseResult.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidShape",
        severity: "error",
      }),
    );
    expect(validationResult.ruleResults).toEqual([]);
    expect(validationResult.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidShape",
        severity: "error",
      }),
    );
    expect(compileResult.plan).toBeUndefined();
    expect(compileResult.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidShape",
        severity: "error",
      }),
    );
  });

  it("bounds shared-DAG work when parsing direct profile data", () => {
    const measurement = measureSharedDagDescriptorReads(() =>
      parseValidationProfile(
        profileWithSharedContains(sharedDagDepth) as Parameters<
          typeof parseValidationProfile
        >[0],
      ),
    );

    expect(measurement.result.profile).toBeUndefined();
    expect(measurement.result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidShape",
        severity: "error",
      }),
    );
    expect(measurement.descriptorReads).toBeGreaterThan(0);
    expect(measurement.descriptorReads).toBeLessThanOrEqual(
      sharedDagDescriptorReadsPerClosure,
    );
  });

  it("bounds shared-DAG work at the compiler boundary", () => {
    const measurement = measureSharedDagDescriptorReads(() =>
      compileValidationProfile(profileWithSharedContains(sharedDagDepth)),
    );

    expect(measurement.result.plan).toBeUndefined();
    expect(measurement.result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidShape",
        severity: "error",
      }),
    );
    expect(measurement.descriptorReads).toBeGreaterThan(0);
    expect(measurement.descriptorReads).toBeLessThanOrEqual(
      sharedDagDescriptorReadsPerClosure * 3,
    );
  });

  it("bounds shared-DAG work when validating a direct profile", () => {
    const measurement = measureSharedDagDescriptorReads(() =>
      validateWithProfile(
        normalizedDocument(),
        profileWithSharedContains(sharedDagDepth),
      ),
    );

    expect(measurement.result.ruleResults).toEqual([]);
    expect(measurement.result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidShape",
        severity: "error",
      }),
    );
    expect(measurement.descriptorReads).toBeGreaterThan(0);
    expect(measurement.descriptorReads).toBeLessThanOrEqual(
      sharedDagDescriptorReadsPerClosure * 4,
    );
  });

  it("reuses completed array and record closures", () => {
    const sharedRecord = { value: "Mission" };
    const sharedArray = [sharedRecord];
    const diagnostics: Parameters<typeof closeProfileDataTree>[2] = [];
    const result = closeProfileDataTree(
      {
        firstArray: sharedArray,
        firstRecord: sharedRecord,
        secondArray: sharedArray,
        secondRecord: sharedRecord,
      },
      "Profile",
      diagnostics,
    ) as Record<string, unknown>;

    expect(diagnostics).toEqual([]);
    expect(result.firstArray).toBe(result.secondArray);
    expect(result.firstRecord).toBe(result.secondRecord);
    expect((result.firstArray as unknown[])[0]).toBe(result.firstRecord);
  });

  it("retains depth bounds when a completed subtree is reused deeper", () => {
    const sharedSubtree = nestedValue(180, "Mission");
    const diagnostics: Parameters<typeof closeProfileDataTree>[2] = [];
    const result = closeProfileDataTree(
      {
        shallow: sharedSubtree,
        deep: nestedValue(100, sharedSubtree),
      },
      "Profile",
      diagnostics,
    );

    expect(result).toBe(DATA_CLOSURE_FAILED);
    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.config.invalidShape",
        message: expect.stringContaining("Profile.deep"),
        severity: "error",
      }),
    ]);
  });

  it("rejects a large sparse rules array without scanning its declared length", () => {
    const rules: ValidationProfile["rules"][number][] = [];
    rules.length = 50_000_000;
    const startedAt = performance.now();

    const result = validateWithProfile(normalizedDocument(), {
      syntaxVersion: supportedSyntaxVersion,
      rules,
    });
    const elapsedMilliseconds = performance.now() - startedAt;

    expect(elapsedMilliseconds).toBeLessThan(1_000);
    expect(result.ruleResults).toEqual([]);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        message: "Profile.rules[0] must contain only JSON-safe data properties.",
        severity: "error",
      },
    ]);
  });

  it("still inspects populated non-enumerable rule slots", () => {
    const rules: ValidationProfile["rules"][number][] = [];
    Object.defineProperty(rules, "0", {
      enumerable: false,
      value: {
        ...existsRule("hidden.rule"),
        callback: "must remain unsupported",
      },
    });

    const result = compileValidationProfile({
      syntaxVersion: supportedSyntaxVersion,
      rules,
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "callback".',
        severity: "error",
      },
    ]);
  });

  it("retains original rule indices when reporting duplicate ids", () => {
    const profile = {
      syntaxVersion: supportedSyntaxVersion,
      rules: [null, existsRule("duplicate.rule"), existsRule("duplicate.rule")],
    } as unknown as ValidationProfile;

    const result = validateWithProfile(normalizedDocument(), profile);

    expect(result.ruleResults).toEqual([]);
    expect(result.diagnostics).toContainEqual({
      code: "profile.config.invalidShape",
      message: 'Profile rule at index 2 duplicates rule id "duplicate.rule".',
      severity: "error",
    });
    expect(result.diagnostics).not.toContainEqual(
      expect.objectContaining({
        message: 'Profile rule at index 1 duplicates rule id "duplicate.rule".',
      }),
    );
  });

  it("rejects missing and unsupported syntax versions at the compiler boundary", () => {
    const profiles = [
      { rules: [] },
      { syntaxVersion: "markdown-engine.validation@future", rules: [] },
    ];

    for (const profile of profiles) {
      const result = compileValidationProfile(
        profile as unknown as ValidationProfile,
      );

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.unsupportedSyntaxVersion",
          message:
            'Profile syntaxVersion must be "markdown-engine.validation@v1" or "markdown-engine.validation@v2".',
          severity: "error",
        },
      ]);
    }
  });
});

function normalizedDocument() {
  return normalize(parse("# Objective\nReady\n").parsed, {
    documentVersion: "1.0.0",
  }).document;
}

function existsRule(id: string): ValidationProfile["rules"][number] {
  return {
    id,
    select: { target: "document" },
    assert: { exists: true },
  };
}

function profileWithNestedContains(depth: number): ValidationProfile {
  let contains: unknown = "Mission";

  for (let index = 0; index < depth; index += 1) {
    contains = { nested: contains };
  }

  return {
    syntaxVersion: supportedSyntaxVersion,
    rules: [
      {
        id: "deep.profile",
        select: { target: "document" },
        assert: {
          text: { contains } as unknown as { contains: string },
        },
      },
    ],
  };
}

function profileWithSharedContains(depth: number): ValidationProfile {
  let contains: unknown = "Mission";

  for (let index = 0; index < depth; index += 1) {
    contains = {
      sharedLeft: contains,
      sharedRight: contains,
    };
  }

  return {
    syntaxVersion: supportedSyntaxVersion,
    rules: [
      {
        id: "shared.profile",
        select: { target: "document" },
        assert: {
          text: { contains } as unknown as { contains: string },
        },
      },
    ],
  };
}

function measureSharedDagDescriptorReads<T>(run: () => T): {
  descriptorReads: number;
  result: T;
} {
  let descriptorReads = 0;
  const descriptorSpy = vi
    .spyOn(Object, "getOwnPropertyDescriptor")
    .mockImplementation((value, property) => {
      if (property === "sharedLeft" || property === "sharedRight") {
        descriptorReads += 1;
      }

      return Reflect.getOwnPropertyDescriptor(value, property);
    });

  try {
    const result = run();

    return { descriptorReads, result };
  } finally {
    descriptorSpy.mockRestore();
  }
}

function nestedValue(depth: number, leaf: unknown): unknown {
  let value = leaf;

  for (let index = 0; index < depth; index += 1) {
    value = { nested: value };
  }

  return value;
}
