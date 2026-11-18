/** 链接会渲染成 href，只接受 HTTP / HTTPS。 */
export const isWebUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}
