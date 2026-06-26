"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const rateLimiter_js_1 = require("../middleware/rateLimiter.js");
const env_js_1 = require("../config/env.js");
const yt_search_1 = __importDefault(require("yt-search"));
const router = (0, express_1.Router)();
// GET /api/youtube/search?q=query - Search YouTube videos
router.get('/search', auth_js_1.authMiddleware, rateLimiter_js_1.searchLimiter, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim().length === 0) {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }
        if (!env_js_1.env.YOUTUBE_API_KEY) {
            // Fallback: Use yt-search scraper when no API key is provided
            const r = await (0, yt_search_1.default)(query);
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
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=10&q=${encodeURIComponent(query)}&key=${env_js_1.env.YOUTUBE_API_KEY}`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            console.error('YouTube search error:', errorData);
            res.status(502).json({ error: 'YouTube API error' });
            return;
        }
        const searchData = await searchResponse.json();
        // Get video durations
        const videoIds = searchData.items.map((item) => item.id.videoId).join(',');
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${env_js_1.env.YOUTUBE_API_KEY}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        const items = detailsData.items.map((item) => ({
            videoId: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            duration: parseDuration(item.contentDetails.duration),
        }));
        res.json({ items });
    }
    catch (error) {
        console.error('YouTube search error:', error);
        res.status(500).json({ error: 'Failed to search YouTube' });
    }
});
// GET /api/youtube/video/:id - Get video details
router.get('/video/:id', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const videoId = req.params.id;
        if (!env_js_1.env.YOUTUBE_API_KEY) {
            // Use yt-search to get video details
            try {
                const video = await (0, yt_search_1.default)({ videoId: videoId });
                res.json({
                    videoId: video.videoId,
                    title: video.title,
                    thumbnail: video.thumbnail,
                    channelTitle: video.author?.name || 'Unknown',
                    duration: video.seconds || 0,
                });
            }
            catch (err) {
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
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${env_js_1.env.YOUTUBE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
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
    }
    catch (error) {
        console.error('Get video error:', error);
        res.status(500).json({ error: 'Failed to get video details' });
    }
});
/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds
 */
function parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match)
        return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
}
exports.default = router;
//# sourceMappingURL=youtube.js.map