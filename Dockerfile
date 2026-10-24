# --- Frontend build ---
FROM node:22-alpine AS web
WORKDIR /src/web
RUN npm install -g pnpm@10
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ ./
# Empty VITE_API_URL = same-origin mode: the app calls /api/v1 on its own origin.
ENV VITE_API_URL=""
RUN pnpm build

# --- Backend build ---
FROM golang:1.25-alpine AS go
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=0 go build -o /out/pingdeck ./cmd/pingdeck

# --- Runtime: single image with the binary + built dashboard ---
FROM scratch
COPY --from=go /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=go /out/pingdeck /pingdeck
COPY --from=web /src/web/dist /web/dist
ENTRYPOINT ["/pingdeck"]
