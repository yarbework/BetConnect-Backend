import Groq from "groq-sdk";

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from environment variables.");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

export const generateDescription = async (propertyData) => {
  const { type, subcity, woreda, kebele, size, floor, price, specialName } = propertyData;
  
  const groq = getGroqClient();

  const prompt = `
    Act as a professional real estate agent in Ethiopia. 
    Write a short, catchy, and professional 3-sentence description for a property listing.
    Details:
    - Type: ${type} (for ${propertyData.listingType})
    - Location: ${subcity}, Woreda ${woreda}, Kebele ${kebele} (${specialName})
    - Size: ${size} sqm
    - Floor: ${floor}
    - Price: ${price} ETB
    Make it sound inviting and professional.
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant", 
  });

  return completion.choices[0]?.message?.content || "";
};

// TASK 2: Smart Chatbot
export const chatWithData = async (userQuery, propertyList) => {
  const groq = getGroqClient();

  const prompt = `
    You are the BetConnect AI. The user is looking for a home.
    User Question: "${userQuery}"
    
    I have attached ${propertyList.length} real property results from our database below.
    
    INSTRUCTIONS:
    1. Do NOT list the price or features in your text response. 
    2. Simply acknowledge you found some matches (e.g., "I found 2 great options in Bole for you!").
    3. Tell the user they can click the cards below for full details and agent contact info.
    4. Keep your text extremely short (max 2 sentences).
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile", // UPDATED MODEL ID
  });

  return completion.choices[0]?.message?.content || "";
};