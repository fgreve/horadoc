"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";

const placeholderExamples = [
  "Buscar oftalmologia...",
  "Buscar Dr. Martinez...",
  "Buscar dermatologia...",
  "Buscar clinica Alemana...",
  "Buscar traumatologia...",
];

const popularSpecialties = [
  { name: "Dermatologia", slug: "dermatologia" },
  { name: "Oftalmologia", slug: "oftalmologia" },
  { name: "Cardiologia", slug: "cardiologia" },
  { name: "Ginecologia", slug: "ginecologia" },
  { name: "Traumatologia", slug: "traumatologia" },
  { name: "Neurologia", slug: "neurologia" },
];

export function SearchHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router]
  );

  useEffect(() => {
    if (!query.trim()) return;
    const timeout = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, router]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#57534e]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholderExamples[placeholderIndex]}
            className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 text-lg text-[#1c1917] shadow-xl ring-1 ring-black/5 placeholder:text-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
          />
        </div>
      </form>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {popularSpecialties.map((specialty) => (
          <Link
            key={specialty.slug}
            href={`/search?specialty=${specialty.slug}`}
            className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            {specialty.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
