import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <span className="h-1 w-8 bg-red-900 rounded inline-block mb-3"></span>
        <h1 className="text-3xl font-black tracking-tight">Create account</h1>
        <p className="mt-2 text-black/60">
          Join CinePredict to save your predictions
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-8 sm:p-10 shadow-sm">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 tracking-tight">
              Full name
            </label>
            <input
              type="text"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              placeholder="Jane Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 tracking-tight">
              Email address
            </label>
            <input
              type="email"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 tracking-tight">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded border border-black px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-900"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-black px-5 py-3 text-sm font-bold text-white hover:bg-red-900 transition shadow-lg"
          >
            Create account
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-black/50">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-black hover:underline">
            Log in
          </Link>
        </p>
      </div>
      <p className="mt-6 text-center text-[10px] text-black/40 uppercase tracking-widest">
        Auth connector stub — wire in your provider once you share the doc requirements.
      </p>
    </div>
  );
}
