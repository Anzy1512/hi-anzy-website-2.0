import React from "react";
import { Link } from "react-router-dom";

/**
 * The one boundary between a render-time throw and a blank page.
 *
 * Nothing in the tree caught render errors: a single missing field in an API
 * document, or a lazy route chunk that failed to evaluate, unmounted the whole
 * application and left an empty <div id="root">. This boundary sits inside
 * <main>, so the nav and footer survive, and <main> is keyed by pathname in
 * App.js, so every navigation starts a clean attempt. The error is reported to
 * the console unchanged: nothing here hides it.
 */
export class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Route render failed:", error, info && info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="container-page py-32 pt-[84px]" data-testid="route-error">
        <h1 className="font-display text-4xl">This page hit a problem.</h1>
        <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-[#232A2A]/75">
          The rest of the site is fine. Reload to try this page again, or head back to the start.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn-ink" onClick={() => window.location.reload()}>
            Reload
          </button>
          <Link to="/" className="btn-ink">
            Home
          </Link>
        </div>
      </div>
    );
  }
}
