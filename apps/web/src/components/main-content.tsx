'use client';

export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen">
      {children}
    </main>
  );
}
