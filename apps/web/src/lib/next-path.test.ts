import { describe, expect, it } from "vitest";
import { safeNext } from "./next-path";

describe("safeNext", () => {
  it("accepte un chemin interne", () => expect(safeNext("/guardian/invite/abc", "/dashboard")).toBe("/guardian/invite/abc"));
  it("refuse une adresse externe", () => {
    expect(safeNext("https://evil.example", "/dashboard")).toBe("/dashboard");
    expect(safeNext("//evil.example", "/dashboard")).toBe("/dashboard");
    expect(safeNext(null, "/dashboard")).toBe("/dashboard");
  });
});
