import { PathMatchResult } from "../models/PathMatchResult";

export interface PathMatcher {
  match(
    requestPath: string,
    specificationPaths: string[]
  ): PathMatchResult;
}