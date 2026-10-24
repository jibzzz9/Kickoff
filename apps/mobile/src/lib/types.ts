import type { Database } from "@kickoff/shared";

export type ListingCard = Database["public"]["Views"]["listing_cards"]["Row"];
export type ListingCriterion = Pick<Database["public"]["Tables"]["listing_criteria"]["Row"], "kind" | "key" | "value">;
