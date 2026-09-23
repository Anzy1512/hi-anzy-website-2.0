import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { getInsights } from "@/lib/api";
import { relatedInsightsFor, formatLabel } from "@/lib/knowledge";

/**
 * The knowledge articles that explain a service, discipline, case study or
 * network roster, on that page.
 *
 * Reads the articles' own `related` graph, so a new article that names this
 * page in its metadata appears here with no frontend change. Renders nothing
 * while loading, nothing on failure, nothing when empty: this is an
 * enrichment of a page that is already complete, and a placeholder or an error
 * panel here would claim the page has a problem when only its footnotes do.
 */
// className: the page-level default keeps every existing call site as it was;
// a hub that already provides the container passes its own spacing instead.
export const RelatedReading = ({ kind, slug, title = "READ THE THINKING BEHIND IT", limit = 6, className = "container-page section-pad-b" }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let current = true;
    setItems([]);
    getInsights()
      .then((all) => { if (current) setItems(relatedInsightsFor(kind, slug, Array.isArray(all) ? all : [])); })
      .catch(() => {});
    return () => { current = false; };
  }, [kind, slug]);

  if (items.length === 0) return null;

  return (
    <section className={className} aria-label="Related reading" data-testid={`related-reading-${kind}`}>
      <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
        <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> {title}
      </Reveal>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, limit).map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 70}>
            <Link
              to={`/insights/${p.slug}`}
              className="case-card group flex h-full flex-col rounded-[14px] border border-[#232A2A]/15 bg-[#F7F5EE] p-5"
              data-testid={`related-reading-${p.slug}`}
            >
              <span className="sys-chip text-[#232A2A]/50">{formatLabel(p)} · {p.category.toUpperCase()}</span>
              <p className="font-display mt-2 text-xl leading-tight text-[#232A2A]">{p.title}</p>
              <p className="mt-2 text-[15px] leading-[1.5] text-[#232A2A]/72">{p.definition || p.excerpt}</p>
              <span className="link-draw mt-auto inline-flex items-center gap-1.5 pt-3 text-[13px] font-semibold text-[#232A2A]">
                Read it <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default RelatedReading;
