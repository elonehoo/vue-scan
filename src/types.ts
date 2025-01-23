export interface VueScanBaseOptions {
  enable?: boolean
  hideComponentName?: boolean
  interval?: number
}

export type VueScanOptions = [
  VueScanBaseOptions | undefined,
]
