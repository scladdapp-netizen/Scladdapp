import { useState, useCallback, useRef } from "react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * useGlobalSearch — searches students, classes, and staff by name only.
 * Uses a single backend endpoint that filters by full_name / class_name.
 */
const useGlobalSearch = (schoolId) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(
    (query) => {
      if (!query || query.trim().length < 2) {
        setResults([]);
        return;
      }

      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (!schoolId) return;
        setLoading(true);
        try {
          const res = await fetch(
            `${API_BASE}/api/schools/${schoolId}/search?q=${encodeURIComponent(query.trim())}&limit=5`
          ).then((r) => r.json());

          if (res.success) {
            setResults(
              res.data.map((item) => ({
                _type:  item.type,
                _id:    item.id,
                _label: item.name,
                _sub:   item.sub,
              }))
            );
          } else {
            setResults([]);
          }
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [schoolId]
  );

  const clear = () => {
    setResults([]);
    clearTimeout(debounceRef.current);
  };

  return { results, loading, search, clear };
};

export default useGlobalSearch;
