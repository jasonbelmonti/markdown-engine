export const ANNOTATED_PROFILE_HEADING = "## Annotated shipped profile";

export const ANNOTATED_RULE_CONTRACTS = [
  {
    rule: {
      id: "frontmatter.required",
      select: { target: "document" },
      assert: {
        frontmatterRequired: { fields: ["title", "owner", "status"] },
      },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select the document.",
        "Require own top-level frontmatter fields named `title`, `owner`, and `status`.",
        "Failure means at least one field is absent; this assertion does not require particular values or non-empty strings.",
        "The document selector itself is never empty.",
      ),
      literals: ["document", "frontmatter", "title", "owner", "status", "absent"],
      patterns: [
        affirmativeStatement(
          "affirmative required-fields assertion",
          "Require",
          /own top-level frontmatter fields named `title`,\s+`owner`, and `status`/,
        ),
        semanticSentence(
          "required-fields failure meaning",
          /Failure means at least one field is absent; this assertion does not require particular values or non-empty strings/,
        ),
        semanticSentence(
          "document selector non-empty meaning",
          /The document selector itself is never empty/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "sections.required",
      select: { target: "document" },
      assert: {
        sectionsRequired: {
          order: "strict",
          headings: [
            "Objective",
            "Context / Constraints",
            "Execution Plan",
            "Risk Register",
            "Handoff Links",
          ],
        },
      },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select the document.",
        "Require `Objective`, `Context / Constraints`, `Execution Plan`, `Risk Register`, and `Handoff Links` to occur in that order as an ordered subsequence of the section tree.",
        "Failure means a required heading is missing or the required order cannot be satisfied.",
      ),
      literals: [
        "document",
        "Objective",
        "Context / Constraints",
        "Execution Plan",
        "Risk Register",
        "Handoff Links",
        "subsequence",
        "missing",
      ],
      patterns: [
        affirmativeStatement(
          "affirmative required-sections assertion",
          "Require",
          /`Objective`, `Context \/ Constraints`,\s+`Execution Plan`, `Risk Register`, and `Handoff Links` to occur in that order\s+as an ordered subsequence of the section tree/,
        ),
        semanticPattern("strict heading order", /\bin that order\b/i),
        semanticPattern("ordered subsequence", /\bordered subsequence\b/i),
        semanticSentence(
          "required-sections failure meaning",
          /Failure means a required heading is missing or the required order cannot be satisfied/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "objective.text",
      select: { target: "section", title: "Objective" },
      assert: { text: { contains: "Mission control" } },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select every section whose title exactly equals `Objective`.",
        "Require every selected section's normalized text to contain the literal `Mission control`.",
        "No exact-title section means empty selection; a selected section lacking the literal means assertion failure.",
      ),
      literals: ["Objective", "Mission control", "empty selection", "assertion failure"],
      patterns: [
        semanticPattern("section targets", /\bsections?\b/i),
        semanticPattern(
          "exact Objective title",
          /\btitle exactly equals\b[^.]*\bObjective\b/i,
        ),
        affirmativeStatement(
          "affirmative objective-text assertion",
          "Require",
          /every selected section's normalized text to contain the literal `Mission control`/,
        ),
        semanticSentence(
          "objective-text failure meaning",
          /No exact-title section means empty selection; a selected section lacking the literal means assertion failure/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "objective.length",
      select: { target: "section", title: "Objective" },
      assert: { textLength: { min: 80, max: 180 } },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select every section whose title exactly equals `Objective`.",
        "Require every selected section's normalized text length to be between 80 and 180 inclusive.",
        "No exact-title section means empty selection; text outside the bounds means assertion failure.",
      ),
      literals: ["Objective", "length", "inclusive", "empty selection", "assertion failure"],
      patterns: [
        semanticPattern("section targets", /\bsections?\b/i),
        semanticPattern(
          "exact Objective title",
          /\btitle exactly equals\b[^.]*\bObjective\b/i,
        ),
        affirmativeStatement(
          "affirmative objective-length assertion",
          "Require",
          /every selected section's normalized text length to be between 80 and 180 inclusive/,
        ),
        semanticPattern("minimum length 80", /\b80\b/),
        semanticPattern("maximum length 180", /\b180\b/),
        semanticPattern(
          "inclusive 80 to 180 bounds",
          /\bbetween 80 and 180 inclusive\b/i,
        ),
        semanticSentence(
          "objective-length failure meaning",
          /No exact-title section means empty selection; text outside the bounds means assertion failure/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "risk.heading.text",
      select: { target: "heading", text: "Risk Register" },
      assert: { text: { contains: "Risk Register" } },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select every heading whose visible text exactly equals `Risk Register`.",
        "Require every selected heading's text to contain `Risk Register`.",
        "Exact equality already implies that containment, so the meaningful runtime failure is an empty selection when no such heading exists.",
      ),
      literals: ["Risk Register", "empty selection"],
      patterns: [
        semanticPattern("heading targets", /\bheadings?\b/i),
        affirmativeStatement(
          "affirmative heading-text assertion",
          "Require",
          /every selected heading's text to contain `Risk Register`/,
        ),
        semanticSentence(
          "heading-text empty-selection meaning",
          /Exact equality already implies that containment, so the meaningful runtime failure is an empty selection when no such heading exists/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "risk.table.columns",
      select: {
        target: "table",
        section: "Risk Register",
        header: ["ID", "Mitigation", "Status"],
      },
      assert: {
        tableColumnsRequired: { columns: ["ID", "Mitigation", "Status"] },
      },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select tables contained in `Risk Register` whose header contains `ID`, `Mitigation`, and `Status` in that order.",
        "Require each selected table to contain columns with those names.",
        "The selector already filters for the same three headers, so a table missing one is excluded before the assertion runs.",
        "If no other table matches, failure is empty selection.",
        "This rule does not inspect data-cell content.",
      ),
      literals: [
        "Risk Register",
        "ID",
        "Mitigation",
        "Status",
        "empty selection",
        "data-cell content",
      ],
      patterns: [
        semanticPattern("table targets", /\btables?\b/i),
        semanticPattern("header filter", /\bheaders?\b/i),
        affirmativeStatement(
          "affirmative required-columns assertion",
          "Require",
          /each selected table to contain columns with those names/,
        ),
        semanticSentence(
          "required-columns selector exclusion meaning",
          /The selector already filters for the same three headers, so a table missing one is excluded before the assertion runs/,
        ),
        semanticSentence(
          "required-columns empty-selection meaning",
          /If no other table matches, failure is empty selection/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "risk.ids.unique",
      select: {
        target: "tableCell",
        section: "Risk Register",
        tableHeader: ["ID", "Mitigation", "Status"],
        column: "ID",
      },
      assert: { ids: { prefix: "OPS-RISK", unique: true } },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select data cells from the `ID` column of tables contained in `Risk Register` whose header contains `ID`, `Mitigation`, and `Status` in that order.",
        "`tableHeader` is the table-shape filter; top-level `column` is the extractor.",
        "Require case-sensitive `OPS-RISK`-prefixed ID tokens found across the selected cells to be unique.",
        "Failure means no cells were selected or a matching ID repeats.",
        "Non-matching ID families are ignored, and `prefix` is not a presence requirement.",
      ),
      literals: [
        "Risk Register",
        "ID",
        "Mitigation",
        "Status",
        "tableHeader",
        "column",
        "OPS-RISK",
      ],
      patterns: [
        semanticPattern("data-cell targets", /\bdata cells?\b/i),
        semanticPattern("case-sensitive comparison", /\bcase-sensitive\b/i),
        affirmativeStatement(
          "affirmative uniqueness assertion",
          "Require",
          /case-sensitive `OPS-RISK`-prefixed ID tokens found across the selected\s+cells to be unique/,
        ),
        semanticPattern(
          "empty cell selection",
          /\b(?:empty selection|no cells were selected)\b/i,
        ),
        semanticPattern("duplicate failure", /\brepeats?\b/i),
        semanticSentence(
          "ID uniqueness failure meaning",
          /Failure means no cells were selected or a matching ID repeats/,
        ),
        semanticSentence(
          "ID prefix non-presence meaning",
          /Non-matching ID families are ignored, and `prefix` is not a presence requirement/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "tracked.risk.row",
      select: {
        target: "tableRow",
        section: "Risk Register",
        tableHeader: ["ID", "Mitigation", "Status"],
        where: { column: "Status", equals: "tracked" },
      },
      assert: { text: { contains: "OPS-RISK-1" } },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select complete data rows from tables contained in `Risk Register` whose header contains `ID`, `Mitigation`, and `Status` in that order, keeping only rows whose `Status` cell exactly equals `tracked`.",
        "`where` keeps whole row targets.",
        "Require every selected row's normalized text to contain `OPS-RISK-1`.",
        "No qualifying row means empty selection; any qualifying row lacking that literal means assertion failure.",
      ),
      literals: [
        "Risk Register",
        "ID",
        "Mitigation",
        "Status",
        "tracked",
        "where",
        "OPS-RISK-1",
        "empty selection",
        "assertion failure",
      ],
      patterns: [
        semanticPattern("row targets", /\b(?:complete )?(?:data )?rows?\b/i),
        semanticPattern("header filter", /\bheaders?\b/i),
        semanticPattern("exact row predicate", /\bexactly equals\b/i),
        affirmativeStatement(
          "affirmative row-text assertion",
          "Require",
          /every selected row's normalized text to contain `OPS-RISK-1`/,
        ),
        semanticSentence(
          "tracked-row failure meaning",
          /No qualifying row means empty selection; any qualifying row lacking that literal means assertion failure/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "execution.must.count",
      select: { target: "section", title: "Execution Plan" },
      assert: { textOccurrenceCount: { text: "MUST", count: 2 } },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select every section whose title exactly equals `Execution Plan`.",
        "Require every selected section to contain exactly two non-overlapping literal occurrences of `MUST`.",
        "No matching section means empty selection; any other count means assertion failure.",
      ),
      literals: [
        "Execution Plan",
        "MUST",
        "non-overlapping",
        "empty selection",
        "assertion failure",
      ],
      patterns: [
        semanticPattern("section targets", /\bsections?\b/i),
        affirmativeStatement(
          "affirmative occurrence-count assertion",
          "Require",
          /every selected section to contain exactly two non-overlapping literal\s+occurrences of `MUST`/,
        ),
        semanticPattern("count failure", /\bcount\b/i),
        semanticSentence(
          "occurrence-count failure meaning",
          /No matching section means empty selection; any other count means assertion failure/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "execution.list",
      select: {
        target: "list",
        section: "Execution Plan",
        ordered: false,
      },
      assert: { text: { contains: "Validate profile" } },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select unordered lists contained in `Execution Plan`.",
        "Require every selected list's normalized text to contain `Validate profile`.",
        "No unordered list means empty selection; any selected list lacking the literal means assertion failure.",
      ),
      literals: [
        "Execution Plan",
        "Validate profile",
        "empty selection",
        "assertion failure",
      ],
      patterns: [
        semanticPattern("list targets", /\blists?\b/i),
        semanticPattern("unordered lists", /\bunordered\b/i),
        affirmativeStatement(
          "affirmative list-text assertion",
          "Require",
          /every selected list's normalized text to contain `Validate profile`/,
        ),
        semanticSentence(
          "list-text failure meaning",
          /No unordered list means empty selection; any selected list lacking the literal means assertion failure/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "handoff.paragraph",
      select: {
        target: "textSpan",
        section: "Handoff Links",
        nodeType: "paragraph",
        textIncludes: "handoff packet",
      },
      assert: { text: { contains: "follow-up" } },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select paragraph text spans contained in `Handoff Links` whose normalized text already includes `handoff packet`.",
        "`section`, `nodeType`, and `textIncludes` are all selection filters.",
        "Require every selected span also to contain `follow-up`.",
        "No qualifying span means empty selection; a qualifying span lacking `follow-up` means assertion failure.",
      ),
      literals: [
        "Handoff Links",
        "paragraph",
        "handoff packet",
        "section",
        "nodeType",
        "textIncludes",
        "follow-up",
        "empty selection",
        "assertion failure",
      ],
      patterns: [
        semanticPattern("text-span targets", /\btext spans?\b/i),
        affirmativeStatement(
          "affirmative paragraph-text assertion",
          "Require",
          /every selected span also to contain `follow-up`/,
        ),
        semanticSentence(
          "paragraph-text failure meaning",
          /No qualifying span means empty selection; a qualifying span lacking `follow-up` means assertion failure/,
        ),
      ],
    },
  },
  {
    rule: {
      id: "handoff.link",
      select: {
        target: "link",
        section: "Handoff Links",
        text: "handoff packet",
        url: "./handoff-packet.md",
      },
      assert: { exists: true },
    },
    annotation: {
      canonicalText: canonicalAnnotation(
        "Select links contained in `Handoff Links` whose visible text exactly equals `handoff packet` and whose URL exactly equals `./handoff-packet.md`.",
        "Assert that at least one such link exists.",
        "Failure means empty selection: no link matches every filter.",
      ),
      literals: [
        "Handoff Links",
        "handoff packet",
        "./handoff-packet.md",
        "URL",
        "empty selection",
      ],
      patterns: [
        semanticPattern("link targets", /\blinks?\b/i),
        semanticPattern(
          "exact handoff URL",
          /\bURL exactly equals\b[^.]*\.\/handoff-packet\.md/i,
        ),
        affirmativeStatement(
          "affirmative exists assertion",
          "Assert",
          /that at least one such link exists/,
        ),
        semanticSentence(
          "link empty-selection meaning",
          /Failure means empty selection: no link matches every filter/,
        ),
      ],
    },
  },
];

export const ANNOTATED_PROFILE_CONTRACT = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: ANNOTATED_RULE_CONTRACTS.map(({ rule }) => rule),
};

function semanticPattern(label, pattern) {
  return { label, pattern };
}

function semanticSentence(label, sentence) {
  return semanticPattern(
    label,
    new RegExp(
      `(?:^|[.!?]\\s+)${sentence.source}(?=[.!?](?:\\s|$))`,
      "i",
    ),
  );
}

function affirmativeStatement(label, verb, claim) {
  return semanticSentence(
    label,
    new RegExp(`${verb}\\s+${claim.source}`, "i"),
  );
}

function canonicalAnnotation(...sentences) {
  return sentences.join(" ");
}
