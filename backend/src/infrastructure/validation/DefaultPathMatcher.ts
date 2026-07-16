import { PathMatcher } from "../../domain/validation/PathMatcher";
import { PathMatchResult } from "../../domain/models/PathMatchResult";

export class DefaultPathMatcher implements PathMatcher {
  public match(
    requestPath: string,
    specificationPaths: string[]
  ): PathMatchResult {
    const normalizedRequestPath = this.normalizePath(requestPath);

    for (const specificationPath of specificationPaths) {
      const normalizedSpecificationPath =
        this.normalizePath(specificationPath);

      const parameterNames: string[] = [];

      const regexPattern = normalizedSpecificationPath
        .split("/")
        .map((segment) => {
          const parameterMatch = segment.match(/^\{(.+)\}$/);

          if (parameterMatch) {
            parameterNames.push(parameterMatch[1]);
            return "([^/]+)";
          }

          return this.escapeRegex(segment);
        })
        .join("/");

      const pathRegex = new RegExp(`^${regexPattern}$`);

      const matchResult = normalizedRequestPath.match(pathRegex);

      if (!matchResult) {
        continue;
      }

      const pathParameters: Record<string, string> = {};

      parameterNames.forEach((parameterName, index) => {
        pathParameters[parameterName] = decodeURIComponent(
          matchResult[index + 1]
        );
      });

      return {
        matched: true,
        specificationPath,
        pathParameters,
      };
    }

    return {
      matched: false,
      pathParameters: {},
    };
  }

  private normalizePath(path: string): string {
    if (!path || path === "/") {
      return "/";
    }

    const pathWithoutQueryString = path.split("?")[0];

    return pathWithoutQueryString.replace(/\/+$/, "");
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}