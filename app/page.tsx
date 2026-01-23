import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">lofield.fm</h1>
        <p className="text-zinc-400 mb-8">Chat to create lofi beats with Strudel</p>
        <Link
          href="/strudel"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Open Strudel Chat
        </Link>
      </main>
    </div>
  );
}
