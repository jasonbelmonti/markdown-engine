import { documentQueries } from "../../api/document-queries.js";
import type {
  EngineDocument,
  EngineLink,
  EngineList,
  EngineSection,
  EngineSourceSlice,
  EngineTable,
  EngineTableCell,
  EngineTextSpan,
} from "../../api/document.js";
import { hasOwnProperty, isPlainRecord } from "../../internal/plain-record.js";
import type { DeclarativeSelector } from "../profile/index.js";
import {
  nodeTextByTargetId,
  sectionText,
  sourceFromTarget,
  targetMatchesSection,
} from "./source.js";
import {
  tableCellTargets,
  tableRowTargets,
  tableTargets,
} from "./table-targets.js";

/** @internal Selector results remain internal to declarative validation. */
export interface DeclarativeSelection {
  document: EngineDocument;
  selector: DeclarativeSelector;
  targets: readonly DeclarativeSelectionTarget[];
}

export type DeclarativeSelectorTarget = DeclarativeSelector["target"];

export type DeclarativeSelectionTarget =
  | {
      kind: "document";
      text: string;
    }
  | {
      kind: "section";
      section: EngineSection;
      text: string;
      source?: EngineSourceSlice;
    }
  | {
      kind: "heading";
      section: EngineSection;
      text: string;
      source?: EngineSourceSlice;
    }
  | {
      kind: "table";
      table: EngineTable;
      text: string;
      source?: EngineSourceSlice;
    }
  | {
      kind: "tableRow";
      table: EngineTable;
      rowIndex: number;
      cells: readonly EngineTableCell[];
      text: string;
    }
  | {
      kind: "tableCell";
      table: EngineTable;
      cell: EngineTableCell;
      text: string;
    }
  | {
      kind: "textSpan";
      span: EngineTextSpan;
      text: string;
    }
  | {
      kind: "link";
      link: EngineLink;
      text: string;
      source?: EngineSourceSlice;
    }
  | {
      kind: "list";
      list: EngineList;
      text: string;
      source?: EngineSourceSlice;
    }
  | {
      kind: "frontmatter";
      field?: string;
      value: unknown;
      text: string;
    };

export function resolveDeclarativeSelector(
  document: EngineDocument,
  selector: DeclarativeSelector,
): DeclarativeSelection {
  switch (selector.target) {
    case "document":
      return {
        document,
        selector,
        targets: [
          {
            kind: "document",
            text: documentText(document),
          },
        ],
      };

    case "section":
      return {
        document,
        selector,
        targets: sectionTargets(document, selector),
      };

    case "heading":
      return {
        document,
        selector,
        targets: headingTargets(document, selector),
      };

    case "table":
      return {
        document,
        selector,
        targets: tableTargets(document, selector),
      };

    case "tableRow":
      return {
        document,
        selector,
        targets: tableRowTargets(document, selector),
      };

    case "tableCell":
      return {
        document,
        selector,
        targets: tableCellTargets(document, selector),
      };

    case "textSpan":
      return {
        document,
        selector,
        targets: textSpanTargets(document, selector),
      };

    case "link":
      return {
        document,
        selector,
        targets: linkTargets(document, selector),
      };

    case "list":
      return {
        document,
        selector,
        targets: listTargets(document, selector),
      };

    case "frontmatter":
      return {
        document,
        selector,
        targets: frontmatterTargets(document, selector),
      };

    default:
      return {
        document,
        selector,
        targets: [],
      };
  }
}

function documentText(document: EngineDocument): string {
  return [
    ...documentQueries.sections(document).map((section) => section.title),
    ...documentQueries.textSpans(document).map((span) => span.text),
  ].join("\n");
}

function sectionTargets(
  document: EngineDocument,
  selector: Extract<DeclarativeSelector, { target: "section" }>,
): DeclarativeSelectionTarget[] {
  return documentQueries
    .sections(document, {
      ...(selector.title !== undefined ? { title: selector.title } : {}),
      ...(selector.depth !== undefined ? { depth: selector.depth } : {}),
    })
    .map((section) => ({
      kind: "section" as const,
      section,
      text: sectionText(document, section),
      ...sourceFromTarget(document, section.target),
    }));
}

function headingTargets(
  document: EngineDocument,
  selector: Extract<DeclarativeSelector, { target: "heading" }>,
): DeclarativeSelectionTarget[] {
  return documentQueries
    .sections(document, {
      ...(selector.text !== undefined ? { title: selector.text } : {}),
      ...(selector.depth !== undefined ? { depth: selector.depth } : {}),
    })
    .map((section) => ({
      kind: "heading" as const,
      section,
      text: section.title,
      ...sourceFromTarget(document, section.headingTarget),
    }));
}

function textSpanTargets(
  document: EngineDocument,
  selector: Extract<DeclarativeSelector, { target: "textSpan" }>,
): DeclarativeSelectionTarget[] {
  return documentQueries
    .textSpans(document, {
      ...(selector.nodeType !== undefined ? { nodeType: selector.nodeType } : {}),
      ...(selector.textIncludes !== undefined
        ? { textIncludes: selector.textIncludes }
        : {}),
    })
    .filter((span) => targetMatchesSection(document, span.target.id, selector.section))
    .map((span) => ({
      kind: "textSpan" as const,
      span,
      text: span.text,
    }));
}

function linkTargets(
  document: EngineDocument,
  selector: Extract<DeclarativeSelector, { target: "link" }>,
): DeclarativeSelectionTarget[] {
  return documentQueries
    .links(document, {
      ...(selector.text !== undefined ? { text: selector.text } : {}),
      ...(selector.url !== undefined ? { url: selector.url } : {}),
    })
    .filter((link) => targetMatchesSection(document, link.target.id, selector.section))
    .map((link) => ({
      kind: "link" as const,
      link,
      text: link.text,
      ...sourceFromTarget(document, link.target),
    }));
}

function listTargets(
  document: EngineDocument,
  selector: Extract<DeclarativeSelector, { target: "list" }>,
): DeclarativeSelectionTarget[] {
  return documentQueries
    .lists(document, {
      ...(selector.ordered !== undefined ? { ordered: selector.ordered } : {}),
      ...(selector.depth !== undefined ? { depth: selector.depth } : {}),
    })
    .filter((list) => targetMatchesSection(document, list.target.id, selector.section))
    .map((list) => ({
      kind: "list" as const,
      list,
      text: nodeTextByTargetId(document, list.target.id),
      ...sourceFromTarget(document, list.target),
    }));
}

function frontmatterTargets(
  document: EngineDocument,
  selector: Extract<DeclarativeSelector, { target: "frontmatter" }>,
): DeclarativeSelectionTarget[] {
  if (document.frontmatter === undefined) {
    return [];
  }

  if (selector.field === undefined) {
    return [
      {
        kind: "frontmatter",
        value: document.frontmatter,
        text: valueText(document.frontmatter),
      },
    ];
  }

  if (
    !isPlainRecord(document.frontmatter) ||
    !hasOwnProperty(document.frontmatter, selector.field)
  ) {
    return [];
  }

  const value = document.frontmatter[selector.field];

  return [
    {
      kind: "frontmatter",
      field: selector.field,
      value,
      text: valueText(value),
    },
  ];
}

function valueText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}
