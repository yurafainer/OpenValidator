import { injectable } from "tsyringe";

import { ReferenceResolver } from "../../application/services/ports/ReferenceResolver";

@injectable()
export class OpenApiReferenceResolver implements ReferenceResolver {
  public resolve(
    specification: unknown,
    schema: unknown,
  ): unknown {
    if (!schema || typeof schema !== "object") {
      return schema;
    }

    return this.resolveNode(
      specification as Record<string, unknown>,
      schema,
      new Set<string>(),
    );
  }

  private resolveNode(
    specification: Record<string, unknown>,
    node: unknown,
    resolvingReferences: Set<string>,
  ): unknown {
    if (Array.isArray(node)) {
      return node.map((item) =>
        this.resolveNode(
          specification,
          item,
          resolvingReferences,
        ),
      );
    }

    if (!node || typeof node !== "object") {
      return node;
    }

    const objectNode = node as Record<string, unknown>;
    const reference = objectNode.$ref;

    if (typeof reference === "string") {
      return this.resolveReference(
        specification,
        reference,
        resolvingReferences,
      );
    }

    const resolvedNode: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(objectNode)) {
      resolvedNode[key] = this.resolveNode(
        specification,
        value,
        resolvingReferences,
      );
    }

    return resolvedNode;
  }

  private resolveReference(
    specification: Record<string, unknown>,
    reference: string,
    resolvingReferences: Set<string>,
  ): unknown {
    if (!reference.startsWith("#/")) {
      throw new Error(
        `Only local OpenAPI references are supported: '${reference}'`,
      );
    }

    if (resolvingReferences.has(reference)) {
      throw new Error(
        `Circular OpenAPI reference detected: '${reference}'`,
      );
    }

    resolvingReferences.add(reference);

    try {
      const referencedNode = this.findReferencedNode(
        specification,
        reference,
      );

      return this.resolveNode(
        specification,
        referencedNode,
        resolvingReferences,
      );
    } finally {
      resolvingReferences.delete(reference);
    }
  }

  private findReferencedNode(
    specification: Record<string, unknown>,
    reference: string,
  ): unknown {
    const pathParts = reference
      .substring(2)
      .split("/")
      .map((part) => this.decodeReferencePart(part));

    let currentNode: unknown = specification;

    for (const part of pathParts) {
      if (
        !currentNode ||
        typeof currentNode !== "object" ||
        Array.isArray(currentNode)
      ) {
        throw new Error(
          `OpenAPI reference not found: '${reference}'`,
        );
      }

      currentNode =
        (currentNode as Record<string, unknown>)[part];

      if (currentNode === undefined) {
        throw new Error(
          `OpenAPI reference not found: '${reference}'`,
        );
      }
    }

    return currentNode;
  }

  private decodeReferencePart(part: string): string {
    return part
      .replace(/~1/g, "/")
      .replace(/~0/g, "~");
  }
}