import type { VueAppInstance } from '@vue/devtools-kit'
import { basename, classify } from '@vue/devtools-shared'

interface ComponentBoundingRect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

function createRect() {
  const rect = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    get width() { return rect.right - rect.left },
    get height() { return rect.bottom - rect.top },
  }
  return rect
}

const DEFAULT_RECT = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
}

let range: any
function getTextRect(node: any) {
  if (!range)
    range = document.createRange()

  range.selectNode(node)

  return range.getBoundingClientRect()
}

function mergeRects(a: any, b: any) {
  if (!a.top || b.top < a.top)
    a.top = b.top

  if (!a.bottom || b.bottom > a.bottom)
    a.bottom = b.bottom

  if (!a.left || b.left < a.left)
    a.left = b.left

  if (!a.right || b.right > a.right)
    a.right = b.right

  return a
}

function getAppRecord(instance: VueAppInstance) {
  if (instance.__VUE_DEVTOOLS_NEXT_APP_RECORD__)
    return instance.__VUE_DEVTOOLS_NEXT_APP_RECORD__
  else if (instance.root)
    return instance.appContext.app.__VUE_DEVTOOLS_NEXT_APP_RECORD__
}

function isFragment(instance: VueAppInstance) {
  const subTreeType = instance?.subTree?.type
  if (!subTreeType) {
    return false
  }
  const appRecord = getAppRecord(instance)
  if (appRecord) {
    return appRecord?.types?.Fragment === subTreeType
  }
  return false
}

function getFragmentRect(vnode: any) {
  const rect = createRect()
  if (!vnode.children)
    return rect

  for (let i = 0, l = vnode.children.length; i < l; i++) {
    const childVnode = vnode.children[i]
    let childRect
    if (childVnode.component) {
      childRect = getComponentBoundingRect(childVnode.component)
    }
    else if (childVnode.el) {
      const el = childVnode.el
      if (el.nodeType === 1 || el.getBoundingClientRect)
        childRect = el.getBoundingClientRect()

      else if (el.nodeType === 3 && el.data.trim())
        childRect = getTextRect(el)
    }
    if (childRect)
      mergeRects(rect, childRect)
  }

  return rect
}

export function getComponentBoundingRect(instance: VueAppInstance): ComponentBoundingRect {
  const el = instance?.subTree?.el || instance?.$el

  if (typeof window === 'undefined') {
    // @TODO: Find position from instance or a vnode (for functional components).
    return DEFAULT_RECT
  }

  if (isFragment(instance))
    return getFragmentRect(instance?.subTree)

  else if (el?.nodeType === 1)
    return el?.getBoundingClientRect()

  else if (instance?.subTree?.component || instance?.$vnode)
    return getComponentBoundingRect(instance?.subTree?.component || instance?.$vnode as VueAppInstance)
  else
    return DEFAULT_RECT
}

// ---

function getComponentTypeName(options: VueAppInstance['type']) {
  const name = options?.name || options?._componentTag || options?.tag || options.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__ || options.__name
  if (name === 'index' && options.__file?.endsWith('index.vue')) {
    return ''
  }
  return name
}

function saveComponentGussedName(instance: VueAppInstance, name: string) {
  instance.type.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__ = name
  return name
}

function getComponentFileName(options: VueAppInstance['type']) {
  const file = options.__file
  if (file)
    return classify(basename(file, '.vue'))
}

export function getInstanceName(instance: VueAppInstance) {
  const name = getComponentTypeName(instance?.type || instance?.$vnode || {})
  if (name)
    return name
  if (instance?.root === instance || instance?.$root === instance)
    return 'Root'
  for (const key in instance.parent?.type?.components) {
    if (instance.parent.type.components[key] === instance?.type)
      return saveComponentGussedName(instance, key)
  }

  for (const key in instance.appContext?.components) {
    if (instance.appContext.components[key] === instance?.type)
      return saveComponentGussedName(instance, key)
  }

  const fileName = getComponentFileName(instance?.type || {})
  if (fileName)
    return fileName

  return 'Anonymous Component'
}
