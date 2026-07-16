import { describe, expect, it } from "vitest";
import { DefaultPathMatcher } from "./DefaultPathMatcher";

describe("DefaultPathMatcher", () => {

    const matcher = new DefaultPathMatcher();

    it("should match a static path", () => {

        const result = matcher.match(
            "/accounts",
            ["/accounts"]
        );

        expect(result.matched).toBe(true);
        expect(result.specificationPath).toBe("/accounts");
        expect(result.pathParameters).toEqual({});

    });

    it("should match a path with one parameter", () => {

        const result = matcher.match(
            "/accounts/123",
            ["/accounts/{accountId}"]
        );

        expect(result.matched).toBe(true);
        expect(result.specificationPath)
            .toBe("/accounts/{accountId}");

        expect(result.pathParameters).toEqual({
            accountId: "123"
        });

    });

    it("should match a path with multiple parameters", () => {

        const result = matcher.match(
            "/accounts/123/transactions/456",
            [
                "/accounts/{accountId}/transactions/{transactionId}"
            ]
        );

        expect(result.matched).toBe(true);

        expect(result.pathParameters).toEqual({
            accountId: "123",
            transactionId: "456"
        });

    });

    it("should return false when no path matches", () => {

        const result = matcher.match(
            "/payments",
            [
                "/accounts",
                "/balances"
            ]
        );

        expect(result.matched).toBe(false);

    });

    it("should ignore query string", () => {

        const result = matcher.match(
            "/accounts/123?bookingStatus=booked",
            [
                "/accounts/{accountId}"
            ]
        );

        expect(result.matched).toBe(true);

        expect(result.pathParameters).toEqual({
            accountId: "123"
        });

    });

    it("should ignore trailing slash", () => {

        const result = matcher.match(
            "/accounts/123/",
            [
                "/accounts/{accountId}"
            ]
        );

        expect(result.matched).toBe(true);

        expect(result.pathParameters).toEqual({
            accountId: "123"
        });

    });

});
it("should prefer a static path over a parameterized path", () => {
  const matcher = new DefaultPathMatcher();

  const result = matcher.match(
    "/accounts/special",
    ["/accounts/{accountId}", "/accounts/special"],
  );

  expect(result.specificationPath).toBe("/accounts/special");
  expect(result.pathParameters).toEqual({});
});
