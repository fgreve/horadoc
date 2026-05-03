import Link from "next/link";
import { HeartPulse } from "lucide-react";

function Footer() {
  return (
    <footer className="border-t border-[#e7e5e4] bg-[#fafaf9]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-[#14b8a6]" />
            <span className="text-lg font-bold text-[#1c1917]">HoraDoc</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="https://www.indisa.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#57534e] transition-colors hover:text-[#14b8a6]"
            >
              Indisa
            </Link>
            <Link
              href="https://www.clinicalascondes.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#57534e] transition-colors hover:text-[#14b8a6]"
            >
              CLC
            </Link>
            <Link
              href="https://www.clinicasantamaria.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#57534e] transition-colors hover:text-[#14b8a6]"
            >
              Santa María
            </Link>
            <Link
              href="https://www.clinicaalemana.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#57534e] transition-colors hover:text-[#14b8a6]"
            >
              Alemana
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-[#e7e5e4] pt-6 text-center">
          <p className="text-sm text-[#a8a29e]">
            &copy; {new Date().getFullYear()} HoraDoc. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
