export interface PathMatchResult {
  matched: boolean;
  specificationPath?: string;
  pathParameters: Record<string, string>;
}