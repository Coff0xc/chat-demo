import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { asInertBlob, INERT_BLOB_TYPE, isSafeImageDocument } from '../src/utils/fileBlob.ts'

describe('isSafeImageDocument', () => {
  it('allows raster image types', () => {
    assert.equal(isSafeImageDocument('image/png'), true)
    assert.equal(isSafeImageDocument('image/jpeg; charset=binary'), true)
    assert.equal(isSafeImageDocument('IMAGE/WEBP'), true)
  })

  it('rejects SVG, HTML and empty types', () => {
    assert.equal(isSafeImageDocument('image/svg+xml'), false)
    assert.equal(isSafeImageDocument('image/svg+xml; charset=utf-8'), false)
    assert.equal(isSafeImageDocument('text/html'), false)
    assert.equal(isSafeImageDocument('application/javascript'), false)
    assert.equal(isSafeImageDocument(''), false)
  })
})

describe('asInertBlob', () => {
  it('forces application/octet-stream', () => {
    const source = new Blob(['<svg></svg>'], { type: 'image/svg+xml' })
    const inert = asInertBlob(source)
    assert.equal(inert.type, INERT_BLOB_TYPE)
    assert.notEqual(inert.type, source.type)
  })
})
