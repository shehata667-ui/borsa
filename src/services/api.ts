import { DomainResponseSchema, SourcesResponseSchema, type Domain, type DomainResponse, type SourcesResponse } from '../types/data';

/** في الويب تُترك فارغة (مسار نسبي /api). في الـ APK تُضبط على عنوان الخادم المنشور (https). */
const BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/$/, '');

import { directSources, fetchDomainDirect, isNative } from './direct';

const useDirect = () => isNative() && BASE === '';

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchDomain(domain: Domain, signal?: AbortSignal): Promise<DomainResponse> {
  if (useDirect()) return DomainResponseSchema.parse(await fetchDomainDirect(domain));
  return DomainResponseSchema.parse(await getJson(`${BASE}/api/data/${domain}`, signal));
}

export async function fetchSources(signal?: AbortSignal): Promise<SourcesResponse> {
  if (useDirect()) return SourcesResponseSchema.parse(directSources());
  return SourcesResponseSchema.parse(await getJson(`${BASE}/api/sources`, signal));
}
