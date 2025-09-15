/*
  Deletes rows from the 'documents' table where id is not a valid UUID.
  Usage: npx tsx scripts/cleanup-nonuuid-documents.ts
*/

import { createClient } from '@supabase/supabase-js'

function assertEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing required env ${name}. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.`)
    process.exit(1)
  }
  return v
}

const url = assertEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = assertEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const supabase = createClient(url, key)

const UUID_RE = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

async function tableExists(table: string): Promise<boolean> {
  const { error } = await supabase.from(table as any).select('id').limit(1)
  if (error) {
    const msg = String((error as any)?.message || '')
    const status = (error as any)?.status
    if (status === 404 || /relation|does not exist|not found/i.test(msg)) return false
  }
  return true
}

async function fetchAllIds(table: string): Promise<string[]> {
  const pageSize = 1000
  let from = 0
  const ids: string[] = []
  while (true) {
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
      .from(table as any)
      .select('id', { count: 'estimated' })
      .range(from, to)
    if (error) throw error
    if (!data || data.length === 0) break
    ids.push(...data.map((r: any) => r.id))
    from += data.length
    if (count !== null && from >= (count as number)) break
    if (data.length < pageSize) break
  }
  return ids
}

async function deleteNonUuid(table: string) {
  const exists = await tableExists(table)
  if (!exists) {
    console.log(`Table '${table}' does not exist. Nothing to delete.`)
    return
  }
  const ids = await fetchAllIds(table)
  const bad = ids.filter((id) => !UUID_RE.test(id))
  if (bad.length === 0) {
    console.log(`No non-UUID ids found in '${table}'.`)
    return
  }
  console.log(`Found ${bad.length} non-UUID ids in '${table}'. Deleting...`)
  // Delete in chunks to avoid URL length issues
  const chunkSize = 500
  for (let i = 0; i < bad.length; i += chunkSize) {
    const chunk = bad.slice(i, i + chunkSize)
    const { error } = await supabase.from(table as any).delete().in('id', chunk)
    if (error) throw error
    console.log(`Deleted ${Math.min(chunk.length, bad.length - i)} rows...`)
  }
  console.log('Completed deletion of non-UUID documents.')
}

deleteNonUuid('documents').catch((e) => {
  console.error('Cleanup failed:', e?.message || e)
  process.exit(1)
})


