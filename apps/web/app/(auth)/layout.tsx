import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex flex-col">
      <nav className="flex items-center px-8 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">YK</span>
          </div>
          <span className="text-lg font-bold text-teal-700">YourKalinga</span>
        </Link>
      </nav>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>
      <footer className="py-4 text-center text-xs text-gray-400">
        Maingat na pag-aalaga para sa inyong kalusugan ·{' '}
        <span className="italic">Kalinga</span> means care
      </footer>
    </div>
  );
}
