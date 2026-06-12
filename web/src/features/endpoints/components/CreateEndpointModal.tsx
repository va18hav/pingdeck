import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCreateEndpoint } from "../hooks"
import type { CreateEndpointInput, CreateEndpointResponse, ProviderName } from "../../../types"
import { StripeIcon, GitHubIcon, CustomHmacIcon, ShopifyIcon, WooCommerceIcon, RazorpayIcon, SentryIcon, SlackIcon } from "./EditEndpointModal"

const inputClass =
  "h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
const labelClass =
  "mb-1.5 block text-[14px] font-medium text-ink"
const helperClass =
  "mt-1.5 text-[13px] text-ink-3"


function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-[12px] font-semibold tracking-[0.06em] text-ink-3 uppercase">
      {children}
    </h3>
  )
}


const PROVIDERS: Array<{ value: ProviderName; label: string }> = [
  { value: "custom", label: "Custom HMAC" },
  { value: "stripe", label: "Stripe" },
  { value: "github", label: "GitHub" },
  { value: "shopify", label: "Shopify" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "razorpay", label: "Razorpay" },
  { value: "sentry", label: "Sentry" },
  { value: "slack", label: "Slack" },
]

const PROVIDER_ICON: Record<Exclude<ProviderName, "">, () => React.ReactElement> = {
  custom: CustomHmacIcon,
  stripe: StripeIcon,
  github: GitHubIcon,
  shopify: ShopifyIcon,
  woocommerce: WooCommerceIcon,
  razorpay: RazorpayIcon,
  sentry: SentryIcon,
  slack: SlackIcon,
}


const SECRET_PLACEHOLDER: Record<Exclude<ProviderName, "">, string> = {
  stripe: "whsec_… (from Stripe Webhooks dashboard)",
  github: "Webhook secret configured in GitHub",
  custom: "Shared HMAC-SHA256 secret",
  shopify: "Webhook signing secret (Shopify app admin)",
  woocommerce: "Webhook secret (WooCommerce → Settings → Webhooks)",
  razorpay: "Webhook secret (Razorpay dashboard → Webhooks)",
  sentry: "Client secret (Sentry → Client Keys → Webhooks)",
  slack: "Signing secret (Slack app → Basic Information)",
}


const PROVIDER_HINT: Record<Exclude<ProviderName, "">, string> = {
  stripe: "Verify Stripe webhook signatures",
  github: "Verify GitHub webhook signatures",
  custom: "Any provider, shared HMAC secret",
  shopify: "Verify Shopify webhook signatures",
  woocommerce: "Verify WooCommerce webhook signatures",
  razorpay: "Verify Razorpay webhook signatures",
  sentry: "Verify Sentry webhook signatures",
  slack: "Verify Slack Events API signatures",
}

interface CreateEndpointModalProps {
  onClose: () => void
}


// CreateEndpointModal is two-phase: form → post-create screen that shows the
// raw signing secret exactly once (before navigating to the new endpoint).
export function CreateEndpointModal({ onClose }: CreateEndpointModalProps) {
  const navigate = useNavigate()
  const create = useCreateEndpoint()

  const [created, setCreated] = useState<CreateEndpointResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const [name, setName] = useState("")
  const [targetURL, setTargetURL] = useState("")
  const [provider, setProvider] = useState<ProviderName>("custom")
  const [inboundSecret, setInboundSecret] = useState("")
  const [maxRetries, setMaxRetries] = useState(5)
  const [timeoutMS, setTimeoutMS] = useState(10_000)
  const [slackURL, setSlackURL] = useState("")
  const [showProviderPicker, setShowProviderPicker] = useState(false)

  if (created) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-[520px] rounded-2xl border border-line bg-surface shadow-2xl"
        >
          <div className="px-7 pt-6 pb-5">
            <h2 className="text-[20px] font-bold tracking-[-0.01em] text-ink">
              Endpoint created
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Copy your outbound signing secret now — it verifies every webhook
              PingDeck delivers to your server.{" "}
              <span className="font-semibold text-ink">
                This is the only time it will be shown.
              </span>
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <code className="flex h-11 flex-1 items-center truncate rounded-lg border border-line-strong bg-bg px-3.5 font-mono text-[14px] text-ink">
                {created.SigningSecret}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(created.SigningSecret)
                  setCopied(true)
                }}
                className="h-11 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface px-4 text-[14px] font-medium text-ink hover:bg-hover focus:outline-none"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
          <div className="flex justify-end rounded-b-2xl border-t border-line bg-bg/60 px-7 py-4">
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate(`/endpoints/${created.ID}`)
              }}
              className="h-10 cursor-pointer rounded-lg bg-accent px-5 text-[14px] font-medium text-on-accent hover:bg-accent-hover focus:outline-none"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  const selectedProvider = PROVIDERS.find((p) => p.value === provider)
  const SelectedIcon = PROVIDER_ICON[provider as Exclude<ProviderName, "">]

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          const input: CreateEndpointInput = {
            name,
            target_url: targetURL,
            provider,
            inbound_secret: inboundSecret,
            max_retries: maxRetries,
            timeout_ms: timeoutMS,
            slack_webhook_url: slackURL,
          }
          create.mutate(input, {
            onSuccess: (ep) => setCreated(ep),
          })
        }}
        className="w-[520px] rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <div className="px-7 pt-6 pb-4">
          <h2 className="text-[20px] font-bold tracking-[-0.01em] text-ink">
            Create endpoint
          </h2>
          <p className="mt-1 text-[14px] text-ink-2">
            Receive webhooks from a provider and forward them reliably to your target URL.
          </p>
        </div>

        <div className="max-h-[65vh] space-y-6 overflow-y-auto px-7 py-4">
          <div>
            <label htmlFor="ep-name" className={labelClass}>
              Endpoint name
            </label>
            <input
              id="ep-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. stripe-production"
              className={inputClass}
            />
          </div>

          <section className="border-t border-line pt-5">
            <SectionTitle>Destination</SectionTitle>
            <div className="mt-4">
              <label htmlFor="ep-url" className={labelClass}>
                Target URL
              </label>
              <input
                id="ep-url"
                type="url"
                required
                value={targetURL}
                onChange={(e) => setTargetURL(e.target.value)}
                placeholder="https://api.example.com/webhooks"
                className={inputClass}
              />
              <p className={helperClass}>
                Events are POSTed here as JSON. PingDeck signs every delivery —
                you'll get the outbound signing secret right after creating.
              </p>
            </div>
          </section>

          <section className="space-y-4 border-t border-line pt-5">
            <SectionTitle>Provider source</SectionTitle>
            <div>
              <button
                type="button"
                onClick={() => setShowProviderPicker(true)}
                className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg border border-line-strong bg-surface px-3.5 text-left transition-colors hover:bg-hover focus:outline-none"
              >
                <SelectedIcon />
                <span className="flex-1 text-[15px] text-ink">
                  {selectedProvider?.label}
                </span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 text-ink-3">
                  <path
                    fillRule="evenodd"
                    d="M9.223 17.16a.75.75 0 0 0 .996-.061L16 11.283a.75.75 0 0 0 0-1.066l-5.78-5.816a.75.75 0 0 0-1.06.994l.06.06 5.282 5.315-5.282 5.315a.75.75 0 0 0 .003 1.055Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div>
              <label htmlFor="ep-inbound-secret" className={labelClass}>
                Source secret
              </label>
              <input
                id="ep-inbound-secret"
                required
                value={inboundSecret}
                onChange={(e) => setInboundSecret(e.target.value)}
                placeholder={SECRET_PLACEHOLDER[provider as Exclude<ProviderName, "">]}
                className={inputClass}
              />
              <p className={helperClass}>
                Paste the secret from {selectedProvider?.label} — PingDeck uses
                it to verify webhooks <span className="font-medium">coming from</span> them.
              </p>
            </div>
          </section>

          <section className="border-t border-line pt-5">
            <SectionTitle>Retry policy</SectionTitle>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ep-retries" className={labelClass}>
                  Max retries
                </label>
                <input
                  id="ep-retries"
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  className={inputClass}
                />
                <p className={helperClass}>
                  Attempts before an event is marked FAILED.
                </p>
              </div>
              <div>
                <label htmlFor="ep-timeout" className={labelClass}>
                  Timeout (ms)
                </label>
                <input
                  id="ep-timeout"
                  type="number"
                  min={100}
                  max={60_000}
                  required
                  value={timeoutMS}
                  onChange={(e) => setTimeoutMS(Number(e.target.value))}
                  className={inputClass}
                />
                <p className={helperClass}>
                  Per delivery attempt.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-line pt-5">
            <div className="flex items-center gap-2">
              <SlackIcon />
              <SectionTitle>Notify</SectionTitle>
            </div>
            <div className="mt-4">
              <label htmlFor="ep-slack" className={labelClass}>
                Slack alert webhook <span className="font-normal text-ink-3">(optional)</span>
              </label>
              <input
                id="ep-slack"
                type="url"
                value={slackURL}
                onChange={(e) => setSlackURL(e.target.value)}
                placeholder="https://hooks.slack.com/services/…"
                className={inputClass}
              />
              <p className={helperClass}>
                Get a Slack alert when webhooks keep failing after all retries —
                e.g. when the service behind your target URL is down.
              </p>
            </div>

            {create.isError && (
              <p className="mt-3 text-[14px] text-failed">{create.error.message}</p>
            )}
          </section>
        </div>

        <div className="flex justify-end gap-3 rounded-b-2xl border-t border-line bg-bg/60 px-7 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-lg border border-line-strong bg-surface px-4 text-[14px] font-medium text-ink-2 hover:bg-hover focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="h-10 cursor-pointer rounded-lg bg-accent px-5 text-[14px] font-medium text-on-accent hover:bg-accent-hover focus:outline-none disabled:opacity-40"
          >
            {create.isPending ? "Creating…" : "Create endpoint"}
          </button>
        </div>
      </form>

      {showProviderPicker && (
        <div
          onClick={() => setShowProviderPicker(false)}
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[380px] rounded-2xl border border-line bg-surface p-2 shadow-2xl"
          >
            {PROVIDERS.map((p) => {
              const Icon = PROVIDER_ICON[p.value as Exclude<ProviderName, "">]
              const selected = provider === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setProvider(p.value)
                    setInboundSecret("")
                    setShowProviderPicker(false)
                  }}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors focus:outline-none ${
                    selected ? "bg-bg" : "hover:bg-bg/70"
                  }`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface">
                    <Icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-ink">
                      {p.label}
                    </span>
                    <span className="block truncate text-[13px] text-ink-3">
                      {PROVIDER_HINT[p.value as Exclude<ProviderName, "">]}
                    </span>
                  </span>
                  {selected && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-[#4f46e5]">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
