import React from 'react'

const Unauthorized = () => {
  return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-purple-500/10" />

        <div className="relative z-10 p-10 text-center text-white">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 border border-red-400/20 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>

          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-red-400">
            Error 401
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Unauthorized Access
          </h1>

          <p className="mt-4 text-slate-300 text-base leading-relaxed max-w-md mx-auto">
            You don&apos;t have permission to access this page. Please log in with an authorized account or contact support.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.history.back()}
              className="rounded-2xl bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Go Back
            </button>

            <button
              onClick={() => (window.location.href = '/login')}
              className="rounded-2xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-red-600"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized


