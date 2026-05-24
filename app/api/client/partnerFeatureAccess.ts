import { axiosClient } from './axiosClient'
import { footScannerErrorMessage } from '../foot-scanners/apiErrorMessage'

export type PartnerFeatureItem = {
  title: string
  action: boolean
  path: string
  nested: PartnerFeatureItem[]
}

type Envelope = {
  success?: boolean
  message?: string
  data?: PartnerFeatureItem[]
}

/** GET /v2/feature-access/partner-feature (scanner Token). */
export async function fetchPartnerFeatureAccess (): Promise<PartnerFeatureItem[]> {
  try {
    const { data: json } = await axiosClient.get<Envelope>(
      '/v2/feature-access/partner-feature'
    )
    if (!json?.success) {
      return []
    }
    return Array.isArray(json.data) ? json.data : []
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Feature-Zugriff konnte nicht geladen werden.')
    )
  }
}

export function featureAccessByTitle (
  items: PartnerFeatureItem[]
): Map<string, boolean> {
  const map = new Map<string, boolean>()

  const walk = (list: PartnerFeatureItem[]) => {
    for (const row of list) {
      const title = row.title?.trim()
      if (title) map.set(title, row.action === true)
      if (Array.isArray(row.nested) && row.nested.length > 0) {
        walk(row.nested)
      }
    }
  }

  walk(items)
  return map
}
