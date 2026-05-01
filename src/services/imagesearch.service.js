import axios from 'axios';
import { asyncHandler } from '../utils/asyncHandler.js';


export const checkPinterestOrigin = async (imageBuffer, metadata) => {
   
    const software = metadata.software || "";
    if (software.toLowerCase().includes('pinterest')) return true;

   
    if (!metadata.make && !metadata.model) {
       
        return true; 
    }

 
    return false;
};