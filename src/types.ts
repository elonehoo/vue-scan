export interface VueScanBaseOptions {
  enable?: boolean
  hideComponentName?: boolean
  interval?: number
  enablePanel?: boolean // 添加面板开关选项
}

export type VueScanOptions = [
  VueScanBaseOptions | undefined,
]
