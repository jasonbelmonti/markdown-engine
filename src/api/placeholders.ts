import type {
  MarkdownEngineApiName,
  NormalizeFunction,
  ParseFunction,
  SerializeFunction,
  ValidateFunction,
} from "./contracts.js";

class MarkdownEngineNotImplementedError extends Error {
  constructor(apiName: MarkdownEngineApiName) {
    super(`${apiName} is not implemented in the WP-1A public API skeleton.`);
    this.name = "MarkdownEngineNotImplementedError";
  }
}

function notImplemented(apiName: MarkdownEngineApiName): never {
  throw new MarkdownEngineNotImplementedError(apiName);
}

export const parse: ParseFunction = (_markdown, _options) => notImplemented("parse");

export const normalize: NormalizeFunction = (_parsed, _options) =>
  notImplemented("normalize");

export const validate: ValidateFunction = (_document, _config, _options) =>
  notImplemented("validate");

export const serialize: SerializeFunction = (_result, _options) =>
  notImplemented("serialize");
