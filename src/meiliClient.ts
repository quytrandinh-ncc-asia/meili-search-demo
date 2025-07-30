import { MeiliSearch } from "meilisearch";

export const meiliClient = new MeiliSearch({
  host: "http://localhost:7700",
  apiKey: "dev_key",
});
