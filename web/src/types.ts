


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
