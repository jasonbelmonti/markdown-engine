import type {
  DocumentOptions,
  ParseOptions,
  SchemaOptions,
  ToJSOptions,
} from "yaml";

type YamlParseOptions = ParseOptions & DocumentOptions & SchemaOptions;

export const YAML_PARSE_OPTIONS: YamlParseOptions = {
  compat: null,
  customTags: null,
  intAsBigInt: false,
  keepSourceTokens: false,
  logLevel: "error",
  merge: false,
  prettyErrors: false,
  resolveKnownTags: false,
  schema: "core",
  strict: true,
  stringKeys: false,
  uniqueKeys: true,
  version: "1.2",
};

export const YAML_MATERIALIZE_OPTIONS: ToJSOptions = {
  mapAsMap: true,
  maxAliasCount: 50,
};
