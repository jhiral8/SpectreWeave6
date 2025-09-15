import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const match = pathname.match(/^\/portal\/projects\/([^/]+)\/documents\/([^/]+)(?:\/.*)?$/)
  if (match) {
    const docId = match[2]
    const url = request.nextUrl.clone()
    url.pathname = `/portal/writer/${docId}`
    url.search = search
    return NextResponse.redirect(url, 307)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/projects/:projectId/documents/:docId*'],
}