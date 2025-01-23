export function isDev() {
  return (import.meta.env && import.meta.env.DEV === true)
    // eslint-disable-next-line node/prefer-global/process
    || (process.env.NODE_ENV === 'development')
}
