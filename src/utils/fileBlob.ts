const mimeOf = (value: string) => value.split(';', 1)[0].trim().toLowerCase()

/** 可作为顶层文档打开的栅格图；不含 SVG 等主动内容 */
const RASTER_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/avif',
  'image/tiff',
])

export const isSafeImageDocument = (mimeType: string) => RASTER_IMAGE_TYPES.has(mimeOf(mimeType))

export const INERT_BLOB_TYPE = 'application/octet-stream'

/** 打开或下载附件时使用惰性 MIME，避免 SVG/HTML 作为同源文档执行 */
export const asInertBlob = (blob: Blob) => new Blob([blob], { type: INERT_BLOB_TYPE })

export const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(asInertBlob(blob))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name || 'download'
  anchor.rel = 'noreferrer'
  anchor.click()
  URL.revokeObjectURL(url)
}
