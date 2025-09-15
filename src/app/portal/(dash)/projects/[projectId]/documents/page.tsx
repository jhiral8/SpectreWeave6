import Link from 'next/link'

export default function Page({ params }: { params: { projectId: string } }) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-heading">Documents</h1>
      <div className="rounded-md border border-[--border] p-4 bg-[--card] text-sm">
        <div className="text-[--muted-foreground]">Open the project’s primary document:</div>
        <div className="mt-2">
          <Link className="underline" href={`/portal/writer/${params.projectId}`}>Open Writer</Link>
        </div>
      </div>
    </div>
  )
}


