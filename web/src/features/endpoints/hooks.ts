import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createEndpoint, deleteEndpoint, fetchEndpoint, fetchEndpoints, regenerateSigningSecret, updateEndpoint } from "./api"
import type { CreateEndpointInput, UpdateEndpointInput } from "../../types"




export function useEndpoints() {
  return useQuery({
    queryKey: ["endpoints"],
    queryFn: fetchEndpoints,
  })
}


export function useEndpoint(id: string | null) {
  return useQuery({
    queryKey: ["endpoints", id],
    queryFn: () => fetchEndpoint(id!),
    enabled: id !== null,
  })
}


export function useCreateEndpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEndpointInput) => createEndpoint(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints"] })
    },
  })
}


export function useUpdateEndpoint(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateEndpointInput) => updateEndpoint(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints"] })
    },
  })
}


export function useDeleteEndpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEndpoint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints"] })
    },
  })
}


export function useRegenerateSigningSecret(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => regenerateSigningSecret(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints"] })
    },
  })
}
