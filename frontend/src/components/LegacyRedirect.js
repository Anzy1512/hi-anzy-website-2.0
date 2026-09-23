import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * In-app half of a legacy URL's redirect.
 *
 * The nine standalone pages absorbed into their hubs (docs/IA_CONSOLIDATION_AUDIT.md)
 * answer with a permanent redirect at the edge: nginx in the Docker image,
 * Vercel's redirects while it is the fallback, Amplify's rules once live.
 * This component covers the cases the edge never sees — a client-side
 * navigation to the old path, and a host that answers the SPA shell before
 * its rules run — so the old URL lands on the same section either way.
 *
 * `replace` keeps the Back button natural: the visitor came from wherever
 * they were, not from a redirecting page. The query string travels with the
 * request; the fragment names the section, and ScrollToTop takes it from
 * there with the same nav offset every hash destination gets.
 */
export const LegacyRedirect = ({ to }) => {
  const { search } = useLocation();
  const [pathname, hash = ""] = to.split("#");
  return <Navigate to={{ pathname, search, hash: hash ? `#${hash}` : "" }} replace />;
};
