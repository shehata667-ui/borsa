import { z } from 'zod';

export const DATA_MODES = ['LIVE', 'DELAYED', 'PERIODIC', 'END_OF_DAY', 'STALE', 'OFFLINE', 'DEMO'] as const;
export type DataMode = (typeof DATA_MODES)[number];

export const DOMAINS = ['market', 'stocks', 'gold', 'fx', 'funds', 'bank-products', 'economy', 'news'] as const;
export type Domain = (typeof DOMAINS)[number];

export const QuoteSchema = z.object({
  instrument_id: z.string(),
  instrument_name: z.string(),
  instrument_type: z.enum(['index', 'stock', 'gold', 'fx', 'fund', 'rate', 'indicator']),
  symbol: z.string().optional(),
  value: z.number(),
  currency: z.string().optional(),
  unit: z.string().optional(),
  absolute_change: z.number().optional(),
  percentage_change: z.number().optional(),
  source_name: z.string(),
  source_timestamp: z.string(),
  received_at: z.string().optional(),
  data_mode: z.enum(DATA_MODES),
  market_status: z.string().optional(),
  delay_seconds: z.number().optional(),
  error_status: z.string().optional(),
  fund: z
    .object({
      page_url: z.string(),
      manager: z.string().optional(),
      category: z.string().optional(),
      category_ar: z.string().optional(),
      min_subscription: z.string().optional(),
      frequency: z.string().optional(),
      subscription_fee: z.string().optional(),
      redemption_fee: z.string().optional(),
      last_change_pct: z.number().optional(),
      returns: z.record(z.number()).optional(),
      prospectus_url: z.string().optional(),
    })
    .optional(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  source_name: z.string(),
  published_at: z.string(),
  url: z.string().url(),
  category: z.string().optional(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const DomainResponseSchema = z.object({
  domain: z.string(),
  configured: z.boolean(),
  env_var: z.string().optional(),
  message: z.string().optional(),
  items: z.array(QuoteSchema),
  news: z.array(NewsItemSchema).optional(),
});
export type DomainResponse = z.infer<typeof DomainResponseSchema>;

export const SourcesResponseSchema = z.object({
  sources: z.array(
    z.object({
      domain: z.string(),
      label: z.string(),
      env_var: z.string(),
      configured: z.boolean(),
      adapter_implemented: z.boolean(),
      note: z.string(),
    }),
  ),
});
export type SourcesResponse = z.infer<typeof SourcesResponseSchema>;
