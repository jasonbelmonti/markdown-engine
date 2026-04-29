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
  depth?: unknown;
  url?: unknown;
  title?: unknown;
  lang?: unknown;
  meta?: unknown;
  checked?: unknown;
  ordered?: unknown;
  position?: MdastPositionLike;
  children?: unknown;
}
