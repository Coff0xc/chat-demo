import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readMessageEvent } from '../src/services/api/parseEvent.ts'

describe('readMessageEvent URL allowlist', () => {
  it('drops citations_delta with a non-http(s) URL', () => {
    const event = readMessageEvent({
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'citations_delta',
        citation: {
          type: 'web_search_result_location',
          url: 'javascript:alert(document.domain)',
          title: 'poc',
          cited_text: '',
          encrypted_index: '',
        },
      },
    })
    assert.equal(event, null)
  })

  it('keeps citations_delta with an https URL', () => {
    const event = readMessageEvent({
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'citations_delta',
        citation: {
          type: 'web_search_result_location',
          url: 'https://example.com/page',
          title: 'ok',
          cited_text: '',
          encrypted_index: '',
        },
      },
    })
    assert.ok(event)
    assert.equal(event.type, 'content_block_delta')
  })

  it('filters javascript search results and keeps http(s) ones', () => {
    const event = readMessageEvent({
      type: 'content_block_start',
      index: 1,
      content_block: {
        type: 'web_search_tool_result',
        tool_use_id: 'srvtoolu_1',
        kind: 'search',
        content: [
          {
            type: 'web_search_result',
            url: 'javascript:alert(1)',
            title: 'bad',
            snippet: '',
            site_name: null,
            site_icon: null,
            page_age: null,
          },
          {
            type: 'web_search_result',
            url: 'https://example.com',
            title: 'good',
            snippet: 's',
            site_name: 'example',
            site_icon: 'javascript:alert(1)',
            page_age: null,
          },
        ],
      },
    })
    assert.ok(event)
    assert.equal(event.type, 'content_block_start')
    if (event.type !== 'content_block_start') {
      return
    }
    const block = event.content_block
    assert.equal(block.type, 'web_search_tool_result')
    if (block.type !== 'web_search_tool_result') {
      return
    }
    assert.equal(block.content.length, 1)
    const item = block.content[0]
    assert.equal(item.type, 'web_search_result')
    if (item.type !== 'web_search_result') {
      return
    }
    assert.equal(item.url, 'https://example.com')
  })
})
