import { useEffect, useState } from "react";

const cache = {};

function useJSON(path) {
  const [state, setState] = useState({ data: cache[path] || null, loading: !cache[path], error: null });

  useEffect(() => {
    if (cache[path]) return;
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/${path}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${path}`);
        return r.json();
      })
      .then((json) => {
        cache[path] = json;
        if (!cancelled) setState({ data: json, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err });
      });
    return () => { cancelled = true; };
  }, [path]);

  return state;
}

export const useOverview = () => useJSON("overview.json");
export const useLinks = () => useJSON("links.json");
export const useTimeline = () => useJSON("timeline.json");
export const useConstructs = () => useJSON("constructs.json");
export const usePapersByLink = () => useJSON("papers_by_link.json");
export const useTheoriesByLink = () => useJSON("theories_by_link.json");
export const useTheoriesGlobal = () => useJSON("theories_global.json");
export const useTheoryCoverage = () => useJSON("theory_coverage.json");

export function linkLabel(l) {
  return `${l.source_label} → ${l.target_label}`;
}

export function shortLinkLabel(l) {
  return `${l.source} → ${l.target}`;
}
