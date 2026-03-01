import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = express.Router();

// POST /api/image-gen
router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, provider } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    // For now, use OpenAI DALL·E 3 if available, fallback to Gemini if specified
    let imageUrl = '';
    if (provider === 'GEMINI') {
      // Gemini Vision API (pseudo, replace with real endpoint if available)
      // const response = await axios.post('https://gemini.googleapis.com/v1beta/generateImage', { prompt });
      // imageUrl = response.data.imageUrl;
      imageUrl = 'https://placehold.co/600x400?text=Gemini+Image';
    } else {
      // OpenAI DALL·E 3
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          prompt,
          n: 1,
          size: '1024x768',
          model: 'dall-e-3',
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      imageUrl = response.data.data[0]?.url || '';
    }
    res.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

export default router;
