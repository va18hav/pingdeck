import api from "../../api"
import type { CreateEndpointInput, CreateEndpointResponse, Endpoint, RotateSecretResponse, UpdateEndpointInput } from "../../types"



export async function fetchEndpoints(): Promise<Endpoint[]> {
  const res = await api.get<Endpoint[]>("/endpoints")
  return res.data
}


export async function fetchEndpoint(id: string): Promise<Endpoint> {
  const res = await api.get<Endpoint>(`/endpoints/${id}`)
  return res.data
}


export async function createEndpoint(input: CreateEndpointInput): Promise<CreateEndpointResponse> {
  const res = await api.post<CreateEndpointResponse>("/endpoints", input)
  return res.data
}

