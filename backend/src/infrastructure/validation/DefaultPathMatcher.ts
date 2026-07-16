import { PathMatcher } from "../../domain/validation/PathMatcher";
import { PathMatchResult } from "../../domain/models/PathMatchResult";

export class DefaultPathMatcher implements PathMatcher {
  public match(
    requestPath: string,
    specificationPaths: string[],
  ): PathMatchResult {
    const normalizedRequestPath = this.normalizePath(requestPath);
    const orderedPaths = [...specificationPaths].sort(
      (left, right) => this.compareSpecificity(left, right),
    );

    for (const specificationPath of orderedPaths) {
      const normalizedSpecificationPath = this.normalizePath(specificationPath);
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
        pathParameters[parameterName] = this.safeDecode(
          matchResult[index + 1],
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

  private compareSpecificity(left: string, right: string): number {
    const leftParameterCount = this.countParameters(left);
    const rightParameterCount = this.countParameters(right);

    if (leftParameterCount !== rightParameterCount) {
      return leftParameterCount - rightParameterCount;
    }

    return right.length - left.length;
  }

  private countParameters(path: string): number {
    return (path.match(/\{[^/]+\}/g) ?? []).length;
  }

  private normalizePath(path: string): string {
    if (!path || path === "/") {
      return "/";
    }

    const pathWithoutQueryString = path.split("?")[0];
    return pathWithoutQueryString.replace(/\/+$/, "");
  }

  private safeDecode(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
