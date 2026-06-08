import axios from "axios"

// ApiError carries the HTTP status (0 = no response: network failure/timeout).
export class ApiError extends Error {

  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// One axios instance for the whole dashboard; baseURL already includes /api/v1.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  timeout: 10_000,
})

// Surface the server's error text + status instead of axios's generic one.
api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data
      const message =
        typeof data === "string" && data.length > 0
          ? data
          : (error.response?.statusText ?? error.message)
      throw new ApiError(error.response?.status ?? 0, message)
    }
    throw error
  },
)

export default api
