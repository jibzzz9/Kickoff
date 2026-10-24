import { describe, expect, it } from "vitest";
import fr from "./locales/fr";
import de from "./locales/de";

const keys = (o: object, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

describe("traductions", () => {
  it("le français et l'allemand ont exactement les mêmes clés", () => {
    expect(keys(de).sort()).toEqual(keys(fr).sort());
  });
});
