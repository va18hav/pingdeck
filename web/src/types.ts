


// Types mirror the Go backend's JSON verbatim:
// - read/list responses: Go field names are capitalized (no json tags)
// - create/update request bodies: snake_case (Go-side json tags)
// Note: SigningSecret appears only in create/rotate responses, raw and once.

export interface Endpoint {
  ID: string
  Name: string
  TargetURL: string
  Provider: string
  InboundSecret: string
  SigningSecretMasked: string
  MaxRetries: number
  TimeoutMS: number
  SlackWebhookURL: string
  IsActive: boolean
  CreatedAt: string
  UpdatedAt: string
}


export type ProviderName =
  | ""
  | "stripe"
  | "github"
  | "custom"
  | "shopify"
  | "woocommerce"
  | "razorpay"
  | "sentry"
  | "slack"


export interface CreateEndpointInput {
  name: string
  target_url: string
  provider: ProviderName
  inbound_secret: string
  max_retries: number
  timeout_ms: number
  slack_webhook_url: string
}


export interface CreateEndpointResponse {
  ID: string
  Name: string
  TargetURL: string
  Provider: string
  InboundSecret: string
  SigningSecret: string
  MaxRetries: number
  TimeoutMS: number
  SlackWebhookURL: string
  IsActive: boolean
  CreatedAt: string
  UpdatedAt: string
}


export type UpdateEndpointInput = CreateEndpointInput


export interface RotateSecretResponse {
  SigningSecret: string
}



export type EventStatus =
  | "PENDING"
  | "PROCESSING"
  | "DELIVERED"
  | "RETRYING"
  | "FAILED"


export interface WebhookEvent {
  ID: string
  EndpointID: string
  Headers: Record<string, string>
  RawBody: string
  ContentType: string
  Status: EventStatus
  AttemptCount: number
  NextRetryAt: string
  LockedAt: string
  CreatedAt: string
  UpdatedAt: string
}


export interface EventWithAttempts {
  event: WebhookEvent
  attempts: DeliveryAttempt[]
}


// Cursor for the keyset pagination: rows strictly older than (before, beforeId).
export interface Cursor {
  before: string
  beforeId: string
}


export interface DeliveryAttempt {
  id: string
  event_id: string
  attempt_number: number
  response_status: number | null 
  response_headers: Record<string, string> | null
  response_body: string | null
  execution_time_ms: number
  error_message: string | null
  attempted_at: string
}
