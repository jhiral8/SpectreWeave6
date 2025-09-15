'use client'

export default function PortalVoicesPage() {
  const demo = [
    { id: 'surgena-author', name: 'Surgena Author' },
    { id: 'tech-formal', name: 'Technical Formal' },
  ]
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-heading">Voices</h1>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {demo.map(v => (
          <li key={v.id} className="rounded-lg border border-[--border] bg-[--card] p-4">
            <div className="font-medium">{v.name}</div>
            <div className="mt-2 text-sm text-[--muted-foreground]">ID: {v.id}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}


