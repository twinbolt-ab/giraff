import { type ConnectionErrorType } from '@/lib/connection-diagnostics'

export type Step = 'welcome' | 'connect' | 'complete'

export type AuthMethod = 'oauth' | 'token'

export type UrlStatus = 'idle' | 'checking' | 'success' | 'failed'

export type DiagnosticStatus = 'idle' | 'checking' | 'success' | 'failed'

export interface UrlSuggestion {
  url: string
  label: string
  status: UrlStatus
}

export interface LiveDiagnosticState {
  show: boolean
  httpsStatus: DiagnosticStatus
  websocketStatus: DiagnosticStatus
  errorType?: ConnectionErrorType
}
