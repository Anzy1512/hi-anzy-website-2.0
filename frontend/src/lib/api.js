import axios from "axios";

const BACKEND_URL = (import.meta.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
export const API = `${BACKEND_URL}/api`;
axios.defaults.timeout = 15000;

export const getCaseStudies = (featured) =>
  axios.get(`${API}/case-studies`, { params: featured != null ? { featured } : {} }).then((r) => r.data);

export const getCaseStudy = (slug) => axios.get(`${API}/case-studies/${slug}`).then((r) => r.data);

export const getNetwork = (category) =>
  axios.get(`${API}/network`, { params: category ? { category } : {} }).then((r) => r.data);

export const getNetworkCategories = () => axios.get(`${API}/network/categories`).then((r) => r.data.categories);

export const getEcosystem = (category) =>
  axios.get(`${API}/ecosystem`, { params: category ? { category } : {} }).then((r) => r.data);

export const getInsights = (category) =>
  axios.get(`${API}/insights`, { params: category ? { category } : {} }).then((r) => r.data);

export const getInsight = (slug) => axios.get(`${API}/insights/${slug}`).then((r) => r.data);

export const submitContact = (payload) => axios.post(`${API}/contact`, payload).then((r) => r.data);

export const subscribe = (payload) => axios.post(`${API}/subscribe`, payload).then((r) => r.data);

/** Analytics — clear event names, fire-and-forget. GA4/Plausible-ready hook point. */
export const track = (name, meta = {}) => {
  try {
    axios.post(`${API}/analytics/event`, { name, meta, path: window.location.pathname }).catch(() => {});
    if (window.gtag) window.gtag("event", name, meta);
    if (window.plausible) window.plausible(name, { props: meta });
  } catch (e) {
    /* analytics must never break the app */
  }
};
