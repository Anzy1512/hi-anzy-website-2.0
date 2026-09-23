import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// react-query's QueryClientProvider used to wrap the app here, configured but
// never actually used: no component anywhere calls useQuery, useMutation, or
// any other react-query hook -- every real data-fetch in the app is plain
// axios + useState/useEffect. The provider shipped in the bundle and stood up
// a QueryClient (with its own online/visibility listeners) for zero benefit.
// See package.json for the dependency removal.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
