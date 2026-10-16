import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:1234";
const TOPIC_ID = "tutorial-videos-library";

// Where a video is shown. An empty key is the general placement — the dashboard
// tutorial card and the floating helper — which is what every video saved
// before placements existed falls back to.
export const TUTORIAL_PAGE_GENERAL = "";
export const TUTORIAL_PAGE_WEBSITE_BRIEF = "website-brief";
export const TUTORIAL_PAGE_LANDING = "landing";

export function tutorialThumb(video, quality = "hqdefault") {
  if (video?.thumbnail) return video.thumbnail;
  if (!video?.youtubeId) return "";
  return `https://img.youtube.com/vi/${video.youtubeId}/${quality}.jpg`;
}

const normalizePage = (page) => String(page || "").trim().toLowerCase();

export function parseYoutubeId(input = "") {
  const trimmed = String(input).trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : trimmed;
}

function toVideos(docs) {
  const allItems = (docs || []).flatMap((section) => section.items || []);
  const topic = allItems.find((item) => item.id === TOPIC_ID);
  const blocks = topic?.blocks || [];

  return blocks
    .filter((block) => block?.type === "video")
    .map((block) => ({
      youtubeId: parseYoutubeId(block.youtubeId || ""),
      title: block.title || "Tutorial Video",
      description: block.description || "",
      duration: block.duration || "",
      category: block.category || "Tutorial",
      page: normalizePage(block.page),
      thumbnail: block.thumbnail || "",
    }))
    .filter((video) => video.youtubeId);
}

function forPage(videos, page) {
  const key = normalizePage(page);
  return videos.filter((v) => v.page === key);
}

export function useTutorialVideos(page = TUTORIAL_PAGE_GENERAL) {
  const [docs, setDocs] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/docs`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDocs(data.data);
        setAllVideos(toVideos(data.data));
      }
    } catch (_) {
      setDocs(null);
      setAllVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const videos = useMemo(() => forPage(allVideos, page), [allVideos, page]);

  return useMemo(() => ({
    docs,
    videos,
    loading,
    refetch: fetchVideos,
  }), [docs, videos, loading, fetchVideos]);
}

export function getTutorialVideosTopicId() {
  return TOPIC_ID;
}
