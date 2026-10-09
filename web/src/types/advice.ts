import type { ApiMeta } from "./air-quality";

export interface AdviceResponse extends ApiMeta {
  generated_by: string;
  headline: string;
  details: string;
  actions: string[];
}
