


// decodeBase64 decodes the backend's base64 raw_body into UTF-8 text.
export function decodeBase64(b64: string): string {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return new TextDecoder("utf-8").decode(bytes)
}


// payloadText pretty-prints JSON payloads; null = undecodable bytes.
export function payloadText(b64: string, contentType: string): string | null {
  try {
    const text = decodeBase64(b64)
    if (contentType.includes("application/json")) {
      try {
        return JSON.stringify(JSON.parse(text), null, 2)
      } catch {
      }
    }
    return text
  } catch {
    return null
  }
}
