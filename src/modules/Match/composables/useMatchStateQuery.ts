import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue, watch } from 'vue'
import { ApiError } from '@/common/utilities/http'
import { fetchMatchState } from '../api/matchApi'
import type { MatchState } from '../types/match.types'

const RETRY_DELAY_MS = 1500

/** Long-poll: кастомный queryFn и ручной рефетч после каждого ответа вместо refetchInterval. */
export function useMatchStateQuery(matchId: MaybeRefOrGetter<string>) {
  const client = useQueryClient()
  const queryKey = computed(() => ['match', toValue(matchId)])

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      const since = client.getQueryData<MatchState>(queryKey.value)?.stateVersion
      return fetchMatchState(toValue(matchId), since, signal)
    },
    retry: (_count, error) => !(error instanceof ApiError && error.status === 404),
    retryDelay: RETRY_DELAY_MS,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  watch(query.dataUpdatedAt, () => {
    if (query.data.value && query.data.value.status !== 'CLOSED') void query.refetch()
  })

  function setState(state: MatchState) {
    client.setQueryData(queryKey.value, state)
  }

  return { ...query, setState }
}
