
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    // 🚧 DEBUG MODE: Skipping all Auth/Supabase logic to verify Vercel deployment
    console.log('🚧 Middleware bypassed for debugging')
    return NextResponse.next({
        request: {
            headers: request.headers,
        },
    })
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
