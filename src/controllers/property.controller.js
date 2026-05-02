import Property from '../models/property.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateDescription } from '../services/ai.service.js';
import { checkImageAuthenticity } from '../services/aiImage.service.js'; 
import fs from 'fs';

export const createProperty = asyncHandler(async (req, res) => {
    const imagePaths = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];
    let isFlagged = false;

    if (req.files && req.files.length > 0) {
        try {
            const firstImageBuffer = await fs.promises.readFile(req.files[0].path);
            const detection = await checkImageAuthenticity(firstImageBuffer);
            if (detection?.isFake) isFlagged = true;
        } catch (err) {
            console.error("AI Image Check Failed:", err.message);
        }
    }

    const {
        size, type, floor, price, listingType, subcity,
        woreda, kebele, specialName, description, bedrooms, bathrooms,
        lat, lng 
    } = req.body;

        const location = (lat && lng) ? {
        type: "Point",
        coordinates: [
            parseFloat(lng), 
            parseFloat(lat) 
        ]  
    }: undefined;

    const generatedAiDescription = await generateDescription({
        type: listingType, subcity, woreda, kebele, 
        size, floor, price, specialName
    });

    const property = await Property.create({
        agent: req.user._id,
        size: Number(size),
        type: type.toLowerCase(),
        floor,
        price: Number(price),
        listingType,
        images: imagePaths,
        subcity,
        woreda,
        kebele,
        specialName,
        description,
        aiDescription: generatedAiDescription,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        aiFlagged: isFlagged,
        location,
    });

    res.status(201).json(property);
});

export const getMyProperties = asyncHandler(async (req, res) => {
    const properties = await Property.find({ agent: req.user._id }).sort({ createdAt: -1 });
    res.json(properties);
});

export const getProperties = asyncHandler(async (req, res) => {
    const {
        keyword, minPrice, maxPrice, listingType, 
        subcity, type, page = 1, limit = 10
    } = req.query;

    const query = {status: 'available'}; 

    if (keyword) {
        query.$or = [
            { subcity: { $regex: keyword, $options: 'i' } },
            { specialName: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { type: { $regex: keyword, $options: 'i' } }
        ];
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (listingType) query.listingType = listingType;
    if (subcity) query.subcity = subcity;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const properties = await Property.find(query)
        .populate('agent', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip)
        .lean();

    const total = await Property.countDocuments(query);

    const sanitizedProperties = properties.map(property => {
        const p = { ...property };
        if (!req.user && p.agent) delete p.agent.phone;
        return p;
    });

    res.json({
        properties: sanitizedProperties,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
    });
});

export const getNearbyProperties = asyncHandler(async (req, res) => {
    const { lat, lng, radius = 5000 } = req.query; 

    if (!lat || !lng) {
        return res.status(400).json({ message: "lat and lng are required" });
    }

    const properties = await Property.find({
        location: {
            $near: {
                $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                $maxDistance: Number(radius)
            }
        }
    }).populate("agent", "name email phone");

    res.json(properties);
});

export const getPropertyById = asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id).populate('agent', 'name email phone');
    if (!property) return res.status(404).json({ message: 'Property not found' });
    const propertyObj = property.toObject();
    if (!req.user && propertyObj.agent) delete propertyObj.agent.phone;
    res.json(propertyObj);
});

export const updateProperty = asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.agent.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    
    Object.assign(property, req.body);
    const updated = await property.save();
    res.json(updated);
});

export const deleteProperty = asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);
    if (!property || property.agent.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    await property.deleteOne();
    res.json({ message: 'Property removed' });
});