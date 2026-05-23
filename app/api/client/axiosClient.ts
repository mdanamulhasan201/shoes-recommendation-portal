/**
 * Single HTTP client for the FeetF1rst backend.
 *
 * - Base URL: `API_BASE_URL` from `apiConfig` → `.env` `NEXT_PUBLIC_API_ENDPOINT`
 * - Auth: reads `foot-scanner-auth-token` from localStorage → headers `Token` + `Authorization`
 *
 * Import `axiosClient` in `app/api/client/*Api.ts` for backend calls (base URL + Token from `.env` / localStorage).
 */

import axios, { AxiosHeaders } from 'axios'
import { API_BASE_URL } from './apiConfig'
import {
  FOOT_SCANNER_TOKEN_STORAGE_KEY,
  SCANNER_AUTH_HEADER_NAME,
  readStoredFootScannerToken
} from '../foot-scanners/scannerAuthToken'

function attachAuthHeaders (
  config: import('axios').InternalAxiosRequestConfig
) {
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers)

  const scannerToken = readStoredFootScannerToken()
  if (scannerToken) {
    headers.set(SCANNER_AUTH_HEADER_NAME, scannerToken)
    headers.set('Authorization', scannerToken)
  } else {
    const envToken = (process.env.NEXT_PUBLIC_API_TOKEN ?? '').trim()
    if (envToken) {
      headers.set(SCANNER_AUTH_HEADER_NAME, envToken)
      headers.set('Authorization', envToken)
    }
  }

  config.headers = headers
  return config
}

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json'
  }
})

axiosClient.interceptors.request.use(
  config => attachAuthHeaders(config),
  error => Promise.reject(error)
)

export { FOOT_SCANNER_TOKEN_STORAGE_KEY, API_BASE_URL }
export default axiosClient
