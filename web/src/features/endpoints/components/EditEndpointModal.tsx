import { useState, type ReactElement } from "react"
import { useRegenerateSigningSecret, useUpdateEndpoint } from "../hooks"
import type { Endpoint, ProviderName, UpdateEndpointInput } from "../../../types"


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

export function StripeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#635BFF]" fill="currentColor" aria-hidden="true">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
    </svg>
  )
}

export function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#181717]" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

export function CustomHmacIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-[#0d9488]" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8 7a5 5 0 1 1 3.61 4.804l-1.903 1.903A1 1 0 0 1 9 14H8v1a1 1 0 0 1-1 1H6v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 .293-.707L8.196 9.39A5.002 5.002 0 0 1 8 7Zm5-3a.75.75 0 0 0 0 1.5A1.5 1.5 0 0 1 14.5 7 .75.75 0 0 0 16 7a3 3 0 0 0-3-3Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-ink-2" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
        clipRule="evenodd"
      />
    </svg>
  )
}


export function SlackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
      <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
      <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" />
      <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  )
}


export function ShopifyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#7AB55C]" fill="currentColor" aria-hidden="true">
      <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z" />
    </svg>
  )
}

export function WooCommerceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#96588A]" fill="currentColor" aria-hidden="true">
      <path d="M.754 9.58a.754.754 0 00-.754.758v2.525c0 .42.339.758.758.758h3.135l1.431.799-.326-.799h2.373a.757.757 0 00.758-.758v-2.525a.757.757 0 00-.758-.758H.754zm2.709.445h.03c.065.001.124.023.179.067a.26.26 0 01.103.19.29.29 0 01-.033.16c-.13.239-.236.64-.322 1.199-.083.541-.114.965-.094 1.267a.392.392 0 01-.039.219.213.213 0 01-.176.12c-.086.006-.177-.034-.263-.124-.31-.316-.555-.788-.735-1.416-.216.425-.375.744-.478.957-.196.376-.363.568-.502.578-.09.007-.166-.069-.233-.228-.17-.436-.352-1.277-.548-2.524a.297.297 0 01.054-.222c.047-.064.116-.095.21-.102.169-.013.265.065.288.238.103.695.217 1.284.336 1.766l.727-1.387c.066-.126.15-.192.25-.199.146-.01.237.083.273.28.083.441.188.817.315 1.136.086-.844.233-1.453.44-1.828a.255.255 0 01.218-.147zm1.293.36c.056 0 .116.006.18.02.232.05.411.177.53.386.107.18.161.395.161.654 0 .343-.087.654-.26.94-.2.332-.459.5-.781.5a.88.88 0 01-.18-.022.763.763 0 01-.531-.384 1.287 1.287 0 01-.158-.659c0-.342.085-.655.258-.937.202-.333.462-.498.78-.498zm2.084 0c.056 0 .116.006.18.02.236.05.411.177.53.386.107.18.16.395.16.654 0 .343-.086.654-.259.94-.2.332-.459.5-.781.5a.88.88 0 01-.18-.022.763.763 0 01-.531-.384 1.287 1.287 0 01-.16-.659c0-.342.087-.655.26-.937.202-.333.462-.498.78-.498zm4.437.047c-.305 0-.546.102-.718.304-.173.203-.256.49-.256.856 0 .395.086.697.256.906.17.21.418.316.744.316.315 0 .559-.107.728-.316.17-.21.256-.504.256-.883s-.087-.673-.26-.879c-.176-.202-.424-.304-.75-.304zm-1.466.002a1.13 1.13 0 00-.84.326c-.223.22-.332.499-.332.838 0 .362.108.658.328.88.22.223.505.336.861.336.103 0 .22-.016.346-.052v-.54c-.117.034-.216.051-.303.051a.545.545 0 01-.422-.177c-.106-.12-.16-.278-.16-.48 0-.19.053-.348.156-.468a.498.498 0 01.397-.181c.103 0 .212.015.332.049v-.537a1.394 1.394 0 00-.363-.045zm12.414 0a1.135 1.135 0 00-.84.326c-.223.22-.332.499-.332.838 0 .362.108.658.328.88.22.223.506.336.861.336.103 0 .22-.016.346-.052v-.54c-.116.034-.216.051-.303.051a.545.545 0 01-.422-.177c-.106-.12-.16-.278-.16-.48 0-.19.053-.348.156-.468a.498.498 0 01.397-.181c.103 0 .212.015.332.049v-.537a1.394 1.394 0 00-.363-.045zm-9.598.06l-.29 2.264h.579l.156-1.559.395 1.559h.412l.379-1.555.164 1.555h.603l-.304-2.264h-.791l-.12.508c-.03.13-.06.264-.087.4l-.067.352a29.97 29.97 0 00-.258-1.26h-.771zm2.768 0l-.29 2.264h.579l.156-1.559.396 1.559h.412l.375-1.555.165 1.555h.603l-.305-2.264h-.789l-.119.508c-.03.13-.06.264-.086.4l-.066.352c-.063-.352-.15-.771-.26-1.26h-.771zm3.988 0v2.264h.611v-1.031h.012l.494 1.03h.645l-.489-1.019a.61.61 0 00.37-.552.598.598 0 00-.25-.506c-.167-.123-.394-.186-.68-.186h-.713zm3.377 0v2.264H24v-.483h-.63v-.414h.54v-.468h-.54v-.416h.626v-.483H22.76zm-4.793.004v2.264h1.24v-.483h-.627v-.416h.541v-.468h-.54v-.415h.622v-.482h-1.236zm2.025.432c.146.003.25.025.313.072.063.046.091.12.091.227 0 .156-.135.236-.404.24v-.54zm-15.22.011c-.104 0-.205.069-.301.211a1.078 1.078 0 00-.2.639c0 .096.02.2.06.303.049.13.117.198.196.215.083.016.173-.02.27-.106.123-.11.205-.273.252-.492.016-.077.023-.16.023-.246 0-.097-.02-.2-.06-.303-.05-.13-.116-.198-.196-.215a.246.246 0 00-.045-.006zm2.083 0c-.103 0-.204.069-.3.211a1.078 1.078 0 00-.2.639c0 .096.02.2.06.303.049.13.117.198.196.215.083.016.173-.02.27-.106.123-.11.205-.273.252-.492.013-.077.023-.16.023-.246 0-.097-.02-.2-.06-.303-.05-.13-.116-.198-.196-.215a.246.246 0 00-.045-.006zm4.428.006c.233 0 .354.218.354.66-.004.273-.038.46-.098.553a.293.293 0 01-.262.139.266.266 0 01-.242-.139c-.056-.093-.084-.28-.084-.562 0-.436.11-.65.332-.65Z" />
    </svg>
  )
}

export function RazorpayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#0C2451]" fill="currentColor" aria-hidden="true">
      <path d="M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.297L11.65 24h4.391l6.395-24zM14.26 10.098L3.389 17.166 1.564 24h9.008l3.688-13.902Z" />
    </svg>
  )
}

export function SentryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#362D59]" fill="currentColor" aria-hidden="true">
      <path d="M13.91 2.505c-.873-1.448-2.972-1.448-3.844 0L6.904 7.92a15.478 15.478 0 0 1 8.53 12.811h-2.221A13.301 13.301 0 0 0 5.784 9.814l-2.926 5.06a7.65 7.65 0 0 1 4.435 5.848H2.194a.365.365 0 0 1-.298-.534l1.413-2.402a5.16 5.16 0 0 0-1.614-.913L.296 19.275a2.182 2.182 0 0 0 .812 2.999 2.24 2.24 0 0 0 1.086.288h6.983a9.322 9.322 0 0 0-3.845-8.318l1.11-1.922a11.47 11.47 0 0 1 4.95 10.24h5.915a17.242 17.242 0 0 0-7.885-15.28l2.244-3.845a.37.37 0 0 1 .504-.13c.255.14 9.75 16.708 9.928 16.9a.365.365 0 0 1-.327.543h-2.287c.029.612.029 1.223 0 1.831h2.297a2.206 2.206 0 0 0 1.922-3.31z" />
    </svg>
  )
}


const PROVIDERS: Array<{ value: ProviderName; label: string; icon: () => ReactElement }> = [
  { value: "custom", label: "Custom HMAC", icon: CustomHmacIcon },
  { value: "stripe", label: "Stripe", icon: StripeIcon },
  { value: "github", label: "GitHub", icon: GitHubIcon },
  { value: "shopify", label: "Shopify", icon: ShopifyIcon },
  { value: "woocommerce", label: "WooCommerce", icon: WooCommerceIcon },
  { value: "razorpay", label: "Razorpay", icon: RazorpayIcon },
  { value: "sentry", label: "Sentry", icon: SentryIcon },
  { value: "slack", label: "Slack", icon: SlackIcon },
]


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

interface EditEndpointModalProps {
  endpoint: Endpoint
  onClose: () => void
}

// EditEndpointModal handles settings updates plus the regenerate flow:
// confirm → POST rotate-secret → one-time reveal of the raw new secret.
export function EditEndpointModal({ endpoint, onClose }: EditEndpointModalProps) {
  const update = useUpdateEndpoint(endpoint.ID)
  const regenerate = useRegenerateSigningSecret(endpoint.ID)

  const [name, setName] = useState(endpoint.Name)
  const [targetURL, setTargetURL] = useState(endpoint.TargetURL)
  const [provider, setProvider] = useState<ProviderName>(
    (endpoint.Provider as ProviderName) ?? ""
  )
  const [inboundSecret, setInboundSecret] = useState(endpoint.InboundSecret)
  const [maxRetries, setMaxRetries] = useState(endpoint.MaxRetries)
  const [timeoutMS, setTimeoutMS] = useState(endpoint.TimeoutMS)
  const [slackURL, setSlackURL] = useState(endpoint.SlackWebhookURL)
  const [showProviderPicker, setShowProviderPicker] = useState(false)

  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (revealed) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-[520px] rounded-2xl border border-line bg-surface shadow-2xl"
        >
          <div className="px-7 pt-6 pb-5">
            <h2 className="text-[20px] font-bold tracking-[-0.01em] text-ink">
              Signing secret regenerated
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Copy your new signing secret now.{" "}
              <span className="font-semibold text-ink">
                This is the only time it will be shown.
              </span>
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <code className="flex h-11 flex-1 items-center truncate rounded-lg border border-line-strong bg-bg px-3.5 font-mono text-[14px] text-ink">
                {revealed}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(revealed)
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
              onClick={onClose}
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          const input: UpdateEndpointInput = {
            name,
            target_url: targetURL,
            provider,
            inbound_secret: provider === "" ? "" : inboundSecret,
            max_retries: maxRetries,
            timeout_ms: timeoutMS,
            slack_webhook_url: slackURL,
          }
          update.mutate(input, { onSuccess: onClose })
        }}
        className="w-[520px] rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <div className="px-7 pt-6 pb-4">
          <h2 className="text-[20px] font-bold tracking-[-0.01em] text-ink">
            Endpoint settings
          </h2>
          <p className="mt-1 text-[14px] text-ink-2">
            Update how this endpoint receives and delivers webhooks.
          </p>
        </div>

        <div className="max-h-[65vh] space-y-6 overflow-y-auto px-7 py-4">
          <div>
            <label htmlFor="ep-edit-name" className={labelClass}>
              Endpoint name
            </label>
            <input
              id="ep-edit-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <section className="space-y-4 border-t border-line pt-5">
            <SectionTitle>Destination</SectionTitle>
            <div>
              <label htmlFor="ep-edit-url" className={labelClass}>
                Target URL
              </label>
              <input
                id="ep-edit-url"
                type="url"
                required
                value={targetURL}
                onChange={(e) => setTargetURL(e.target.value)}
                className={inputClass}
              />
              <p className={helperClass}>
                Events are POSTed here as JSON.
              </p>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <LockIcon />
                <span className="text-[14px] font-semibold text-ink">
                  Outbound signing secret
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <code className="flex h-11 min-w-0 flex-1 items-center truncate rounded-lg border border-line-strong bg-bg px-3.5 font-mono text-[14px] text-ink">
                  {endpoint.SigningSecretMasked}
                </code>
                {confirmRegenerate ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmRegenerate(false)}
                      className="h-11 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface px-4 text-[14px] font-medium text-ink-2 hover:bg-hover focus:outline-none"
                    >
                      Keep current
                    </button>
                    <button
                      type="button"
                      disabled={regenerate.isPending}
                      onClick={() =>
                        regenerate.mutate(undefined, {
                          onSuccess: (res) => setRevealed(res.SigningSecret),
                        })
                      }
                      className="h-11 shrink-0 cursor-pointer rounded-lg bg-failed px-4 text-[14px] font-medium text-on-accent hover:opacity-90 focus:outline-none disabled:opacity-40"
                    >
                      {regenerate.isPending ? "Generating…" : "Confirm"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRegenerate(true)}
                    className="h-11 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface px-4 text-[14px] font-medium text-ink-2 hover:bg-hover focus:outline-none"
                  >
                    Regenerate
                  </button>
                )}
              </div>
              {confirmRegenerate ? (
                <p className="mt-2.5 text-[13px] text-failed">
                  The current secret stops working immediately — servers still
                  using it will receive <code className="font-mono text-[13px]">401</code> responses until
                  you update their environment.
                </p>
              ) : (
                <p className={helperClass}>
                  PingDeck's own secret — signs webhooks{" "}
                  <span className="font-medium">going out to</span> the target URL.
                  Regenerating kills the old one instantly.
                </p>
              )}
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
                {selectedProvider && <selectedProvider.icon />}
                <span className="flex-1 text-[15px] text-ink">
                  {selectedProvider?.label ?? "Select a source"}
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
            {provider !== "" && (
              <div>
                <label htmlFor="ep-edit-secret" className={labelClass}>
                  Source secret
                </label>
                <input
                  id="ep-edit-secret"
                  required
                  value={inboundSecret}
                  onChange={(e) => setInboundSecret(e.target.value)}
                  placeholder={SECRET_PLACEHOLDER[provider]}
                  className={inputClass}
                />
                <p className={helperClass}>
                  Paste the secret from {selectedProvider?.label} — PingDeck uses
                  it to verify webhooks <span className="font-medium">coming from</span> them.
                </p>
              </div>
            )}
          </section>

          <section className="border-t border-line pt-5">
            <SectionTitle>Retry policy</SectionTitle>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ep-edit-retries" className={labelClass}>
                  Max retries
                </label>
                <input
                  id="ep-edit-retries"
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
                <label htmlFor="ep-edit-timeout" className={labelClass}>
                  Timeout (ms)
                </label>
                <input
                  id="ep-edit-timeout"
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
              <label htmlFor="ep-edit-slack" className={labelClass}>
                Slack alert webhook <span className="font-normal text-ink-3">(optional)</span>
              </label>
              <input
                id="ep-edit-slack"
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

            {update.isError && (
              <p className="mt-3 text-[14px] text-failed">{update.error.message}</p>
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
            disabled={update.isPending}
            className="h-10 cursor-pointer rounded-lg bg-accent px-5 text-[14px] font-medium text-on-accent hover:bg-accent-hover focus:outline-none disabled:opacity-40"
          >
            {update.isPending ? "Saving…" : "Save changes"}
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
              const Icon = p.icon
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
