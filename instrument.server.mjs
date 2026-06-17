import * as Sentry from '@sentry/tanstackstart-react'

// This file is loaded raw by Node via --import (it is not compiled by Vite),
// so every value is read from process.env at runtime. In production set these
// as real host environment variables — .env files are not auto-loaded here.
const sentryDsn = import.meta.env?.VITE_SENTRY_DSN ?? process.env.VITE_SENTRY_DSN
const environment =
  process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'
const release = process.env.SENTRY_RELEASE
const isProduction = environment === 'production'

// Performance tracing is sampled to control event volume/cost. Override per
// deploy with SENTRY_TRACES_SAMPLE_RATE; otherwise sample lightly in production
// and fully elsewhere.
const parsedTracesRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
const defaultTracesRate = isProduction ? 0.1 : 1
const tracesSampleRate = Number.isFinite(parsedTracesRate)
  ? parsedTracesRate
  : defaultTracesRate

if (!sentryDsn) {
  console.warn('VITE_SENTRY_DSN is not defined. Sentry is not running.')
} else {
  Sentry.init({
    dsn: sentryDsn,
    // Tag every event so prod/staging/dev are separable in the dashboard.
    environment,
    // Correlate an error with the deploy that produced it (no-op if unset).
    release,
    tracesSampleRate,
    // Captures request headers and client IP. This is a personal-finance app —
    // review your privacy stance (and consider a beforeSend scrubber) before
    // keeping this enabled in production.
    sendDefaultPii: true,
  })
}
