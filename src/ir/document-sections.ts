import type {
  EngineNode,
  EngineSection,
  EngineTarget,
} from "../api/document.js";
import { requireNodeTarget } from "./document-targets.js";

interface MutableSection {
  target: EngineTarget;
  headingTarget: EngineTarget;
  depth: number;
  title: string;
  bodyTargets: EngineTarget[];
  childSections: EngineTarget[];
}

export function buildSections(
  children: readonly EngineNode[],
): readonly EngineSection[] {
  const sections: MutableSection[] = [];
  const stack: MutableSection[] = [];

  for (const node of children) {
    if (isHeading(node)) {
      const depth = headingDepth(node);
      const section = sectionForHeading(node, depth);
      let currentSection = stack.at(-1);

      while (currentSection !== undefined && currentSection.depth >= depth) {
        stack.pop();
        currentSection = stack.at(-1);
      }

      currentSection?.childSections.push(section.target);
      sections.push(section);
      stack.push(section);
      continue;
    }

    if (node.target !== undefined) {
      stack.at(-1)?.bodyTargets.push(node.target);
    }
  }

  return sections.map((section) => ({
    target: section.target,
    headingTarget: section.headingTarget,
    depth: section.depth,
    title: section.title,
    bodyTargets: section.bodyTargets,
    childSections: section.childSections,
  }));
}

function isHeading(node: EngineNode): boolean {
  return node.type === "heading" && node.target !== undefined;
}

function headingDepth(node: EngineNode): number {
  return typeof node.attributes?.depth === "number" ? node.attributes.depth : 0;
}

function sectionForHeading(
  node: EngineNode,
  depth: number,
): MutableSection {
  const headingTarget = requireNodeTarget(node);

  return {
    target: {
      ...headingTarget,
      id: `section:${headingTarget.id}`,
      nodeType: "section",
    },
    headingTarget,
    depth,
    title: node.text ?? "",
    bodyTargets: [],
    childSections: [],
  };
}
