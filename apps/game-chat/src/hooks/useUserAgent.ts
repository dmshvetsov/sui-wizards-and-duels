import { useMemo } from 'react'
import { UAParser } from 'ua-parser-js'

export function useUserAgent() {
  return useMemo(() => {
    const ClientUAInstance = new UAParser()
    const device = ClientUAInstance.getDevice()
    return {
      isMobile: device.type === 'mobile',
    }
  }, [])
}
