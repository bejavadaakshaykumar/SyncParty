import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimiter.js';
import { env } from '../config/env.js';
import ytSearch from 'yt-search';

const router = Router();

// GET /api/youtube/search?q=query - Search YouTube videos
router.get('/search', authMiddleware, searchLimiter, async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    if (!env.YOUTUBE_API_KEY) {
      // Fallback: Use yt-search scraper when no API key is provided
      const r = await ytSearch(query);
      const videos = r.videos.slice(0, 10);
      const items = videos.map(v => ({
        videoId: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        channelTitle: v.author.name,
        duration: v.seconds,
      }));
      res.json({ items });
      return;
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=10&q=${encodeURIComponent(query)}&key=${env.YOUTUBE_API_KEY}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('YouTube search error:', errorData);
      res.status(502).json({ error: 'YouTube API error' });
      return;
    }

    const searchData: any = await searchResponse.json();

    // Get video durations
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${env.YOUTUBE_API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData: any = await detailsResponse.json();

    const items = detailsData.items.map((item: any) => ({
      videoId: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      duration: parseDuration(item.contentDetails.duration),
    }));

    res.json({ items });
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

// GET /api/youtube/video/:id - Get video details
router.get('/video/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = req.params.id;

    if (!env.YOUTUBE_API_KEY) {
      // Use yt-search to get video details
      try {
        const video = await ytSearch({ videoId });
        res.json({
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelTitle: video.author.name,
          duration: video.seconds,
        });
      } catch (err) {
        // Ultimate fallback
        res.json({
          videoId,
          title: `Video ${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          channelTitle: 'Unknown',
          duration: 0,
        });
      }
      return;
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${env.YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data: any = await response.json();

    if (!data.items || data.items.length === 0) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const item = data.items[0];
    res.json({
      videoId: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      duration: parseDuration(item.contentDetails.duration),
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to get video details' });
  }
});

/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

export default router;
