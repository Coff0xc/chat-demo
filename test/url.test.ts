import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isWebUrl } from '../src/utils/url.ts'

describe('isWebUrl', () => {
  it('accepts http and https', () => {
    assert.equal(isWebUrl('https://example.com/a'), true)
    assert.equal(isWebUrl('http://localhost:8090'), true)
    assert.equal(isWebUrl('HTTPS://Example.COM'), true)
  })

  it('rejects javascript, data, blob and relative values', () => {
    assert.equal(isWebUrl('javascript:alert(1)'), false)
    assert.equal(isWebUrl('JAVASCRIPT:alert(document.domain)'), false)
    assert.equal(isWebUrl('data:text/html,<script>alert(1)</script>'), false)
    assert.equal(isWebUrl('blob:https://example.com/1'), false)
    assert.equal(isWebUrl('file:///tmp/index.html'), false)
    assert.equal(isWebUrl('vbscript:msgbox(1)'), false)
    assert.equal(isWebUrl(''), false)
    assert.equal(isWebUrl('example.com'), false)
    assert.equal(isWebUrl('//example.com'), false)
  })
})
