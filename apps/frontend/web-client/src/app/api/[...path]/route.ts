import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.BACKEND_API_URL || 'https://avoalert-api.onrender.com'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return proxyRequest(request, resolvedParams.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return proxyRequest(request, resolvedParams.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return proxyRequest(request, resolvedParams.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return proxyRequest(request, resolvedParams.path, 'DELETE')
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/')
    const url = `${API_BASE_URL}/${path}`
    
    // Get search params from original request
    const searchParams = request.nextUrl.searchParams
    const finalUrl = searchParams.toString() 
      ? `${url}?${searchParams.toString()}` 
      : url

    // Prepare headers
    const headers: HeadersInit = {}
    
    // Copy relevant headers
    const headersToProxy = [
      'content-type',
      'authorization',
      'x-api-key',
      'user-agent'
    ]
    
    headersToProxy.forEach(headerName => {
      const value = request.headers.get(headerName)
      if (value) {
        headers[headerName] = value
      }
    })

    // Prepare body for POST/PUT requests
    let body: string | undefined
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.text()
      } catch (error) {
        console.error('Error reading request body:', error)
      }
    }

    // Make the proxy request
    const response = await fetch(finalUrl, {
      method,
      headers,
      body,
    })

    // Get response data
    const responseText = await response.text()
    
    // Create the response with proper headers
    const nextResponse = new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
    })

    // Copy response headers
    response.headers.forEach((value, key) => {
      // Skip headers that could cause issues
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        nextResponse.headers.set(key, value)
      }
    })

    // Add CORS headers for development
    nextResponse.headers.set('Access-Control-Allow-Origin', '*')
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')

    return nextResponse

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  })
}