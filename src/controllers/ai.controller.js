import Property from '../models/property.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { chatWithData } from '../services/ai.service.js';

export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMsg = message.toLowerCase();

    const isRent = lowerMsg.includes('rent');
    const isSale = lowerMsg.includes('buy') || lowerMsg.includes('sale');
    
    const types = ["house", "apartment", "villa", "condo", "studio", "commercial", "land"];
    let foundType = types.find(t => lowerMsg.includes(t));

    let query = { status: 'available' }; 

    if (isRent) query.listingType = 'rent';
    if (isSale) query.listingType = 'sale';
    if (foundType) query.type = foundType;

    const subcities = ["Bole", "CMC", "Lebu", "Ayat", "Old Airport", "Kazanchis", "Lideta", "Gullele", "Arada", "Addis Ketema", "Kolfe Keranio", "Nifas Silk", "Akaki"];
    let foundSubcity = subcities.find(s => lowerMsg.includes(s.toLowerCase()));
    if (foundSubcity) query.subcity = new RegExp(foundSubcity, 'i');

    const priceMatch = lowerMsg.match(/(?:under|less than|max|budget)\s?(\d+(?:k|000)?)/);
    if (priceMatch) {
        let val = priceMatch[1].replace('k', '000');
        query.price = { $lte: Number(val) };
    }

    const matches = await Property.find(query)
        .populate('agent', 'name phone')
        .limit(3)
        .lean();

    const aiResponse = await chatWithData(message, matches);

    res.json({ 
      response: aiResponse, 
      properties: matches 
    });

  } catch (error) {
    console.error("AI Chat Error:", error.message);
    res.status(500).json({ message: "The AI is having trouble thinking. Try again." });
  }
};