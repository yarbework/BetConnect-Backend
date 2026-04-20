import Property from '../models/property.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { chatWithData } from '../services/ai.service.js';

export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;

    const isRent = message.toLowerCase().includes('rent');
    const isSale = message.toLowerCase().includes('buy') || message.toLowerCase().includes('sale');
    
    let query = {};

    if (isRent) query.listingType = 'rent';
    if (isSale) query.listingType = 'sale';

    const subcities = ["Bole", "CMC", "Lebu", "Ayat", "Old Airport", "Kazanchis", "Lideta", "Gullele", "Arada", "Addis Ketema", "Kolfe Keranio", "Nifas Silk-Lafto", "Akaki Kaliti"];
    
    let foundSubcity = subcities.find(s => message.toLowerCase().includes(s.toLowerCase()));

    if (foundSubcity) query.subcity = new RegExp(foundSubcity, 'i');
    
    const matches = await Property.find(query).limit(5).select('-agentId');

    const aiResponse = await chatWithData(message, matches);

    res.json({ response: aiResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};