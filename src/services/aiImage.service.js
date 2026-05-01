import axios from "axios";

export const checkImageAuthenticity = async (imageBuffer) => {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/dima806/ai_vs_real_image_detection",
      imageBuffer,
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
      }
    );
   const aiScore = response.data.find(item => item.label === "FAKE")?.score || 0;
   return {
      isFake: aiScore > 0.8,
      score : aiScore
   };
  }  catch (error){
    console.error("Error checking image authenticity:", error);


    return {    
      isFake: false,
      score: 0
    };
  }
};