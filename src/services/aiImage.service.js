// Service: AI Image generation helper
// Expects two env vars to be present when used:
// - AI_IMAGE_API_URL: endpoint for the image generation API
// - AI_IMAGE_API_KEY: bearer/api key for the provider

export const generateAIImage = async (prompt, options = {}) => {
  const endpoint = process.env.AI_IMAGE_API_URL;
  const apiKey = process.env.AI_IMAGE_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error('AI image generation is not configured (AI_IMAGE_API_URL/AI_IMAGE_API_KEY).');
  }

  const body = {
    prompt,
    ...options,
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI image API error: ${res.status} ${res.statusText} - ${text}`);
  }

  const data = await res.json();

  // Return the provider response as-is but prefer common fields when available.
  return data.url || data?.data?.[0]?.url || data;
};

export default generateAIImage;
