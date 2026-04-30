export interface MdastPointLike {
  line?: unknown;
  column?: unknown;
  offset?: unknown;
}

export interface MdastPositionLike {
  start?: MdastPointLike;
  end?: MdastPointLike;
}

export interface MdastNodeLike {
  type?: unknown;
  value?: unknown;
  alt?: unknown;
  align?: unknown;
  depth?: unknown;
  identifier?: unknown;
  label?: unknown;
  url?: unknown;
  title?: unknown;
  lang?: unknown;
  meta?: unknown;
  referenceType?: unknown;
  spread?: unknown;
  start?: unknown;
  checked?: unknown;
  ordered?: unknown;
  position?: MdastPositionLike;
  children?: unknown;
}
