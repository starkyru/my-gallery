'use client';

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h2 className="font-serif text-2xl mb-4">Something went wrong</h2>
      <pre className="text-red-400 text-sm mb-6 max-w-xl overflow-auto whitespace-pre-wrap">
        {error.message}
      </pre>
      <button onClick={reset} className="ot-btn ot-btn--solid">
        Try again
      </button>
    </div>
  );
}
