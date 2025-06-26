const express = require('express');
const router = express.Router();
const { pexelsKey, pexelsQuery } = require('../config');
const fetch = require('node-fetch');

const KEY = pexelsKey;

router.get('/image', async (req, res) => {
  const headers = {
    Authorization: `${KEY}`,
  };
  const query = pexelsQuery || 'nature';
  const orientation = 'portrait';
  const perPage = 1;
  const url = `https://api.pexels.com/v1/search?query=${query}&orientation=${orientation}&per_page=${perPage}&page=1`;

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    res.status(200).json(data.photos[0]);
  } catch (error) {
    res.status(200).json({ error: 'Failed to fetch image' });
  }
});

router.get('/video', async (req, res) => {
  const headers = {
    Authorization: `${KEY}`,
  };
  const query = pexelsQuery || 'nature';
  const orientation = 'portrait';
  const perPage = 1;
  const url = `https://api.pexels.com/videos/search?query=${query}&orientation=${orientation}&per_page=${perPage}&page=1`;

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    res.status(200).json(data.videos[0]);
  } catch (error) {
    res.status(200).json({ error: 'Failed to fetch video' });
  }
});

router.get('/multiple-images', async (req, res) => {
  const headers = {
    Authorization: `${KEY}`,
  };

  const queries = req.query.queries
    ? req.query.queries.split(',')
    : ['home', 'apple', 'pizza', 'mountains', 'cat'];
  const orientation = 'square';
  const perPage = 1;

  const fallbackImage = {
    src: 'https://images.pexels.com/photos/8199252/pexels-photo-8199252.jpeg',
    photographer: 'Yan Krukau',
    photographer_url: 'https://www.pexels.com/@yankrukov',
  };
  const fetchFallbackImage = async () => {
    try {
      const response = await fetch('https://picsum.photos/600');
      return {
        src: response.url,
        photographer: 'Random Picsum',
        photographer_url: 'https://picsum.photos/',
      };
    } catch (error) {
      return fallbackImage; 
    }
  };
  const fetchImage = async (query) => {
    const url = `https://api.pexels.com/v1/search?query=${query}&orientation=${orientation}&per_page=${perPage}&page=1`;
    const response = await fetch(url, { headers });
    const data = await response.json();
    return data.photos[0] || null;
  };

  const imagePromises = queries.map((query) => fetchImage(query));
  const imagesResults = await Promise.allSettled(imagePromises);

  const formattedImages = await Promise.all(imagesResults.map(async (result) => {
    if (result.status === 'fulfilled' && result.value) {
      const image = result.value;
      return {
        src: image.src?.original || fallbackImage.src,
        photographer: image.photographer || fallbackImage.photographer,
        photographer_url: image.photographer_url || fallbackImage.photographer_url,
      };
    } else {
      const fallback = await fetchFallbackImage();
      return {
        src: fallback.src || '',
        photographer: fallback.photographer || 'Unknown',
        photographer_url: fallback.photographer_url || '',
      };
    }
  }));
   

  res.json(formattedImages);
});

module.exports = router;
