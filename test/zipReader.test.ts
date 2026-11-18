import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { deflateSync } from 'fflate'
import {
  ArchiveError,
  MAX_ARCHIVE_BYTES,
  MAX_ENTRY_BYTES,
  readArchive,
  readEntry,
  skipEntry,
} from '../src/services/chat/history/zipReader.ts'
import { writeArchive } from '../src/services/chat/history/zipWriter.ts'

const consume = async (file: File) => {
  for await (const entry of readArchive(file)) {
    await skipEntry(entry)
  }
}

const zipDeflateEntries = (entries: { name: string; uncompressedSize: number }[]) => {
  const encoder = new TextEncoder()
  const payload = deflateSync(new Uint8Array([0x61]))
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const local = new Uint8Array(30 + name.length + payload.length)
    const localView = new DataView(local.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(8, 8, true)
    localView.setUint32(18, payload.length, true)
    localView.setUint32(22, entry.uncompressedSize, true)
    localView.setUint16(26, name.length, true)
    local.set(name, 30)
    local.set(payload, 30 + name.length)
    locals.push(local)

    const central = new Uint8Array(46 + name.length)
    const centralView = new DataView(central.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(10, 8, true)
    centralView.setUint32(20, payload.length, true)
    centralView.setUint32(24, entry.uncompressedSize, true)
    centralView.setUint16(28, name.length, true)
    centralView.setUint32(42, offset, true)
    central.set(name, 46)
    centrals.push(central)
    offset += local.length
  }
  const directorySize = centrals.reduce((total, part) => total + part.length, 0)
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  eocdView.setUint32(0, 0x06054b50, true)
  eocdView.setUint16(8, entries.length, true)
  eocdView.setUint16(10, entries.length, true)
  eocdView.setUint32(12, directorySize, true)
  eocdView.setUint32(16, offset, true)
  const bytes = new Uint8Array(offset + directorySize + 22)
  let cursor = 0
  for (const part of locals) {
    bytes.set(part, cursor)
    cursor += part.length
  }
  for (const part of centrals) {
    bytes.set(part, cursor)
    cursor += part.length
  }
  bytes.set(eocd, cursor)
  return new File([bytes], 'archive.zip')
}

describe('zipReader size limits', () => {
  it('reads a small STORE archive', async () => {
    const blob = await writeArchive([{ name: 'hello.txt', blob: new Blob(['hi']) }])
    const file = new File([blob], 'ok.zip')
    const entries = []
    for await (const entry of readArchive(file)) {
      entries.push(entry)
      const data = await readEntry(entry)
      assert.equal(await data.text(), 'hi')
    }
    assert.equal(entries.length, 1)
    assert.equal(entries[0].size, 2)
  })

  it('rejects a declared entry larger than MAX_ENTRY_BYTES', async () => {
    const file = zipDeflateEntries([{ name: 'bomb.txt', uncompressedSize: MAX_ENTRY_BYTES + 1 }])
    await assert.rejects(() => consume(file), ArchiveError)
  })

  it('rejects an archive whose declared uncompressed total exceeds MAX_ARCHIVE_BYTES', async () => {
    const count = Math.floor(MAX_ARCHIVE_BYTES / MAX_ENTRY_BYTES) + 1
    const file = zipDeflateEntries(
      Array.from({ length: count }, (_, index) => ({
        name: `part-${index}.txt`,
        uncompressedSize: MAX_ENTRY_BYTES,
      }))
    )
    await assert.rejects(() => consume(file), ArchiveError)
  })
})
