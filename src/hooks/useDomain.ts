import { useQuery } from '@tanstack/react-query';
import { fetchDomain, fetchSources } from '../services/api';
import type { Domain } from '../types/data';

export function useDomain(domain: Domain) {
  return useQuery({
    queryKey: ['domain', domain],
    queryFn: ({ signal }) => fetchDomain(domain, signal),
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useSources() {
  return useQuery({ queryKey: ['sources'], queryFn: ({ signal }) => fetchSources(signal), retry: 1 });
}
