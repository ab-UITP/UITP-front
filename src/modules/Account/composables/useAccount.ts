import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { login, logout, register, fetchMe, type Account, type Credentials } from '../api/authApi'

const ME_KEY = ['me']

export function useAccount() {
  const client = useQueryClient()
  const me = useQuery({ queryKey: ME_KEY, queryFn: fetchMe, retry: false, staleTime: Infinity })

  const setAccount = (account: Account | null) => client.setQueryData(ME_KEY, account)

  const registerMutation = useMutation({ mutationFn: (c: Credentials) => register(c), onSuccess: setAccount })
  const loginMutation = useMutation({ mutationFn: (c: Credentials) => login(c), onSuccess: setAccount })
  const logoutMutation = useMutation({ mutationFn: logout, onSuccess: () => setAccount(null) })

  return {
    account: me.data,
    isLoading: me.isLoading,
    registerMutation,
    loginMutation,
    logout: () => logoutMutation.mutate(),
  }
}
