import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AssistantMessage } from '../src/services/chat/types.ts'
import { buildReplyView } from '../src/services/chat/view.ts'

const reply = (blocks: AssistantMessage['blocks']): AssistantMessage => ({
  id: 'm1',
  role: 'assistant',
  createdAt: 1,
  model: null,
  prefix: false,
  status: 'done',
  blocks,
})

describe('buildReplyView URL allowlist', () => {
  it('omits javascript citations from sources and markdown markers', () => {
    const view = buildReplyView(
      reply([
        {
          type: 'text',
          text: 'hello',
          citations: [
            {
              type: 'web_search_result_location',
              url: 'javascript:alert(1)',
              title: 'bad',
              cited_text: '',
              encrypted_index: '',
            },
          ],
        },
      ]),
      false
    )
    assert.deepEqual(view.sources, [])
    assert.equal(view.answer?.markdown, 'hello')
  })

  it('registers https citations', () => {
    const view = buildReplyView(
      reply([
        {
          type: 'text',
          text: 'hello',
          citations: [
            {
              type: 'web_search_result_location',
              url: 'https://example.com/a',
              title: 'good',
              cited_text: '',
              encrypted_index: '',
            },
          ],
        },
      ]),
      false
    )
    assert.equal(view.sources.length, 1)
    assert.equal(view.sources[0].url, 'https://example.com/a')
    assert.equal(view.answer?.markdown, 'hello[citation:1]')
  })

  it('drops javascript search results and site icons', () => {
    const view = buildReplyView(
      reply([
        {
          type: 'server_tool_use',
          id: 't1',
          name: 'deepseek_web_search',
          caller: { type: 'direct' },
          kind: 'search',
          input: { action: 'search', queries: ['q'] },
        },
        {
          type: 'web_search_tool_result',
          tool_use_id: 't1',
          kind: 'search',
          content: [
            {
              type: 'web_search_result',
              title: 'bad',
              url: 'javascript:alert(1)',
              snippet: '',
              site_icon: null,
              site_name: null,
              encrypted_content: '',
              page_age: null,
            },
            {
              type: 'web_search_result',
              title: 'good',
              url: 'https://example.com',
              snippet: 's',
              site_icon: 'javascript:alert(1)',
              site_name: 'example',
              encrypted_content: '',
              page_age: null,
            },
          ],
        },
      ]),
      false
    )
    assert.equal(view.sources.length, 1)
    assert.equal(view.sources[0].url, 'https://example.com')
    assert.equal(view.sources[0].siteIcon, null)
    assert.equal(view.searchResults.length, 1)
  })

  it('clears javascript page URLs on open_page', () => {
    const view = buildReplyView(
      reply([
        {
          type: 'server_tool_use',
          id: 't1',
          name: 'deepseek_web_search',
          caller: { type: 'direct' },
          kind: 'deep_search',
          input: { action: 'open_page', url: 'javascript:alert(1)' },
        },
        {
          type: 'web_fetch_tool_result',
          tool_use_id: 't1',
          kind: 'deep_search',
          content: {
            type: 'web_fetch_result',
            url: 'javascript:alert(1)',
            content: {
              type: 'document',
              source: { type: 'text', media_type: 'text/plain', data: '' },
              title: 'Open me',
            },
            published_at: null,
          },
        },
      ]),
      false
    )
    const step = view.steps.find((item) => item.type === 'open')
    assert.ok(step && step.type === 'open')
    assert.equal(step.pages[0].url, '')
    assert.equal(view.sources.length, 0)
  })
})
