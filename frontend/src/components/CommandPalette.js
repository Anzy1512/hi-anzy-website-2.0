import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft } from "lucide-react";
import { track } from "@/lib/api";

/**
 * The command palette. Cmd/Ctrl-K, or the button in the nav.
 *
 * The search index is intentionally loaded only when the palette opens. That
 * keeps the large service/content dataset out of the initial route dependency
 * graph for visitors who never use site search.
 */
export const CommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [searchCommandsFn, setSearchCommandsFn] = useState(null);
  const [indexFailed, setIndexFailed] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open || searchCommandsFn || indexFailed) return undefined;
    let current = true;
    import("@/lib/commandIndex")
      .then((mod) => {
        if (!current) return;
        setSearchCommandsFn(() => mod.searchCommands);
        // Case studies, insights and ecosystem entries are fetched, not
        // static, so they land after the module itself resolves. Setting
        // searchCommandsFn again with a fresh closure (same underlying
        // function, new reference) is what makes the results memo below
        // recompute once they arrive — a real dependency change, not a
        // synthetic counter just to force a re-render.
        mod.loadDynamicIndex().then(() => {
          if (current) setSearchCommandsFn(() => mod.searchCommands);
        });
      })
      .catch(() => {
        if (current) setIndexFailed(true);
      });
    return () => { current = false; };
  }, [open, searchCommandsFn, indexFailed]);

  const results = useMemo(
    () => (searchCommandsFn ? searchCommandsFn(query) : []),
    [query, searchCommandsFn]
  );

  const close = useCallback(() => {
    if (indexFailed) {
      // Resetting indexFailed here used to be the whole fix, and it looked
      // right: it clears the effect's guard, so the next open calls import()
      // again. Verified live that it is not enough. A browser's module
      // registry caches a *failed* dynamic import against its exact URL for
      // the life of the page — a second import() for that same URL rejects
      // immediately from the cache, with no network request at all, even
      // once the file is back and serving 200. Confirmed directly: the same
      // specifier kept failing after the file was restored; only a request
      // with a different URL (or a fresh page) succeeded. Vite resolves
      // "@/lib/commandIndex" to a fixed hashed URL at build time, so there is
      // no query-string trick available here without breaking that
      // resolution. A reload is the standard recovery for a failed chunk
      // load for exactly this reason — it is also what actually fixes the
      // far more common real-world case a transient blip stands in for
      // here: a new deploy shipped while this tab was open, so the loaded
      // bundle is asking for a chunk hash the server no longer has, and no
      // in-page retry can produce a hash the current bundle doesn't know.
      window.location.reload();
      return;
    }
    setOpen(false);
    setQuery("");
    setActive(0);
    const el = returnFocusRef.current;
    if (el && document.contains(el)) el.focus();
  }, [indexFailed]);

  const openPalette = useCallback(() => {
    returnFocusRef.current = document.activeElement;
    setOpen(true);
    track("command_palette_opened");
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (open) close();
        else openPalette();
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, openPalette]);

  useEffect(() => {
    window.__openCommandPalette = openPalette;
    return () => { delete window.__openCommandPalette; };
  }, [openPalette]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const row = list.children[active];
    if (row && row.scrollIntoView) row.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = useCallback(
    (item) => {
      if (!item) return;
      track("command_palette_navigate", { to: item.to, kind: item.kind, q: query.slice(0, 40) });
      returnFocusRef.current = null;
      close();
      navigate(item.to);
      requestAnimationFrame(() => {
        const main = document.getElementById("main");
        if (main) main.focus();
      });
    },
    [navigate, close, query]
  );

  const onInputKey = (e) => {
    if (!searchCommandsFn) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(Math.max(0, results.length - 1));
    }
  };

  if (!open) return null;

  return (
    <div
      className="cmdk-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
      data-testid="command-palette"
    >
      <div
        className="cmdk-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search this site"
      >
        <div className="cmdk-field">
          <Search size={17} aria-hidden="true" className="cmdk-search-icon" />
          <label htmlFor="cmdk-input" className="sr-only">
            Search pages, systems and services
          </label>
          <input
            id="cmdk-input"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search 175 services, six systems, every page…"
            autoComplete="off"
            spellCheck="false"
            className="cmdk-input"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `cmdk-opt-${active}` : undefined}
            data-testid="command-palette-input"
          />
          <kbd className="cmdk-kbd">ESC</kbd>
        </div>

        {!searchCommandsFn && !indexFailed ? (
          <p className="cmdk-empty" role="status">Preparing search…</p>
        ) : indexFailed ? (
          <p className="cmdk-empty" role="status">Search couldn’t load. Close this panel and try again.</p>
        ) : results.length === 0 ? (
          <p className="cmdk-empty" data-testid="command-palette-empty">
            Nothing matches “{query}”. Try a problem rather than a product: “pricing”, “retention”,
            “dashboard”.
          </p>
        ) : (
          <ul
            id="cmdk-list"
            ref={listRef}
            role="listbox"
            aria-label="Results"
            className="cmdk-list"
            data-testid="command-palette-list"
          >
            {results.map((item, i) => (
              <li
                key={`${item.kind}-${item.to}-${item.label}`}
                id={`cmdk-opt-${i}`}
                role="option"
                aria-selected={i === active}
                className={`cmdk-row ${i === active ? "is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); go(item); }}
                data-testid={`command-palette-row-${i}`}
              >
                <span className="cmdk-row-label">{item.label}</span>
                <span className="cmdk-row-meta">
                  <span className="cmdk-row-hint">{item.hint}</span>
                  <span className="cmdk-row-group">{item.group}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="cmdk-foot">
          <span><kbd className="cmdk-kbd">↑</kbd><kbd className="cmdk-kbd">↓</kbd> move</span>
          <span><kbd className="cmdk-kbd"><CornerDownLeft size={11} aria-hidden="true" /></kbd> open</span>
          <span className="cmdk-foot-right">{results.length} result{results.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
