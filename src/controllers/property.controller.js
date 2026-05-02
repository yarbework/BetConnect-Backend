<<<<<<< HEAD
import Property from "../models/property.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
=======
import Property from '../models/property.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateDescription } from '../services/ai.service.js';
import { checkImageAuthenticity } from '../services/aiImage.service.js';
import { watermarkLogic, getSecretCoordinates } from '../services/hash.service.js';
import { checkPinterestOrigin } from '../services/imagesearch.service.js';
import sharp from 'sharp';
import fs from 'fs';
>>>>>>> 13cfce60bcba9ce271b1e82291f36ef43abb7395

// ─── Create Property ────────────────────────────────────────────────────────
// POST /api/properties
export const createProperty = asyncHandler(async (req, res) => {
<<<<<<< HEAD
  const { title, description, price, type, status, images, address, lat, lng } =
    req.body;

  if (!lat || !lng) {
    return res
      .status(400)
      .json({ message: "lat and lng are required for map placement" });
  }

  const property = await Property.create({
    title,
    description,
    price,
    type,
    status,
    images,
    address,
    agent: req.user._id,
    location: {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON: [lng, lat]
    },
  });
=======
    const imagePaths = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];
    let isFlagged = false;

    if (req.files && req.files.length > 0) {
        const firstImagePath = req.files[0].path;
        const firstImageBuffer = await fs.promises.readFile(firstImagePath);
        
        const detection = await checkImageAuthenticity(firstImageBuffer);
        if (detection.isFake) {
            isFlagged = true;
        }

        const { data, info } = await sharp(firstImageBuffer)
            .raw()
            .toBuffer({ resolveWithObject: true });

        const isFromPinterest = await checkPinterestOrigin(firstImageBuffer, info);
        if (isFromPinterest) {
            return res.status(400).json({
                message: "This image appears to be downloaded from the web (Pinterest). Please upload original photos of your property."
            });
        }

        const totalBlocks = Math.floor((info.width * info.height) / 64);
        const secretBlocks = getSecretCoordinates(process.env.WATERMARK_SECRET, totalBlocks);
        const agentIdBuffer = Buffer.from(req.user._id.toString());

        let modifiedData = Buffer.from(data);
        for (let i = 0; i < Math.min(secretBlocks.length, agentIdBuffer.length * 8); i++) {
            const blockIndex = secretBlocks[i];
            const byteOffset = blockIndex * 64; 
            
            if (byteOffset + 64 <= modifiedData.length) {
                let block = [];
                for (let row = 0; row < 8; row++) {
                    block.push(Array.from(modifiedData.slice(byteOffset + (row * 8), byteOffset + (row * 8) + 8)));
                }

                let dctBlock = watermarkLogic.performDCT(block);
                const bit = (agentIdBuffer[Math.floor(i / 8)] >> (i % 8)) & 1;
                dctBlock[3][3] += bit ? 15 : -15; 

                let idctBlock = watermarkLogic.performIDCT(dctBlock);
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        modifiedData[byteOffset + (row * 8) + col] = Math.max(0, Math.min(255, idctBlock[row][col]));
                    }
                }
            }
        }

        await sharp(modifiedData, { raw: { width: info.width, height: info.height, channels: info.channels } })
            .jpeg({ quality: 95 })
            .toFile(firstImagePath + "_protected.jpg");
            
        imagePaths[0] = imagePaths[0] + "_protected.jpg";
    }

    const {
        size, type, floor, price, listingType, subcity,
        woreda, kebele, specialName, description, bedrooms, bathrooms
    } = req.body;

    const generatedAiDescription = await generateDescription({
        type: listingType, subcity, woreda, kebele, size, floor, price,
        specialName: specialName || "this property"
    });

    const property = await Property.create({
        agent: req.user._id,
        size,
        type,
        floor,
        price,
        listingType,
        images: imagePaths,
        subcity,
        woreda,
        kebele,
        specialName,
        description,
        aiDescription: generatedAiDescription,
        bedrooms,
        bathrooms,
        aiFlagged: isFlagged
    });
>>>>>>> 13cfce60bcba9ce271b1e82291f36ef43abb7395

  res.status(201).json(property);
});

<<<<<<< HEAD
// ─── Get All Properties ──────────────────────────────────────────────────────
// GET /api/properties
export const getProperties = asyncHandler(async (req, res) => {
  const { type, status, minPrice, maxPrice } = req.query;
=======
export const getProperties = asyncHandler(async (req, res) => {
    const {
        keyword,
        minPrice,
        maxPrice,
        listingType,
        woreda,
        subcity,
        kebele,
        type,
        minSize,
        maxSize,
        bedrooms,
        status,
        page = 1,
        limit = 10
    } = req.query;
>>>>>>> 13cfce60bcba9ce271b1e82291f36ef43abb7395

  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

<<<<<<< HEAD
  const properties = await Property.find(filter).populate("agent", "name email phone");
  res.json(properties);
=======
    if(keyword){
        query.$or =[
            { subcity: {$regex: keyword, $options: 'i' } },
            { kebele: {$regex: keyword, $options: 'i' } },
            { specialName: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { type: { $regex: keyword, $options: 'i'} }
        ]
    }
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (listingType) query.listingType = listingType;
    if (woreda) query.woreda = woreda;
    if (subcity) query.subcity = subcity;
    if (kebele) query.kebele = kebele;
    if (type) query.type = type;
    if (bedrooms) query.bedrooms = Number(bedrooms);
    if (status) query.status = status;
    if (minSize || maxSize) {
        query.size = {};
        if (minSize) query.size.$gte = Number(minSize);
        if (maxSize) query.size.$lte = Number(maxSize);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const properties = await Property.find(query)
        .populate('agent', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip)
        .lean();

    const total = await Property.countDocuments(query);

    const sanitizedProperties = properties.map(property => {
        if (!req.user && property.agent) {
            delete property.agent.phone;
        }
        return property;
    });

    res.json({
        properties: sanitizedProperties,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
    });
});

export const getMyProperties = asyncHandler(async (req, res) => {
    const properties = await Property.find({ agent: req.user._id }).sort({ createdAt: -1 });
    res.json(properties);
>>>>>>> 13cfce60bcba9ce271b1e82291f36ef43abb7395
});

// ─── Get Single Property ─────────────────────────────────────────────────────
// GET /api/properties/:id
export const getPropertyById = asyncHandler(async (req, res) => {
<<<<<<< HEAD
  const property = await Property.findById(req.params.id).populate(
    "agent",
    "name email phone"
  );

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  res.json(property);
});

// ─── Update Property ─────────────────────────────────────────────────────────
// PUT /api/properties/:id
export const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  // Only the agent who created it or an admin can update
  if (
    property.agent.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const { lat, lng, ...rest } = req.body;

  if (lat && lng) {
    rest.location = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
  }

  const updated = await Property.findByIdAndUpdate(req.params.id, rest, {
    new: true,
    runValidators: true,
  });

  res.json(updated);
});

// ─── Delete Property ──────────────────────────────────────────────────────────
// DELETE /api/properties/:id
export const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (
    property.agent.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await property.deleteOne();
  res.json({ message: "Property deleted" });
});

// ─── Nearby Properties (GPS Search) ──────────────────────────────────────────
// GET /api/properties/nearby?lat=9.03&lng=38.74&radius=5000
// radius is in meters (default 5km)
export const getNearbyProperties = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query;

  if (!lat || !lng) {
    return res
      .status(400)
      .json({ message: "lat and lng query params are required" });
  }

  const properties = await Property.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: Number(radius), // meters
      },
    },
  }).populate("agent", "name email phone");

  res.json(properties);
});
=======
    const property = await Property.findById(req.params.id).populate('agent', 'name email phone');
    if (!property) return res.status(404).json({ message: 'Property not found' });
    const propertyObj = property.toObject();
    if (!req.user && propertyObj.agent) delete propertyObj.agent.phone;
    res.json(propertyObj);
});

export const updateProperty = asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.agent.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const fields = ['size', 'type', 'floor', 'price', 'listingType', 'images', 'subcity', 'woreda', 'kebele', 'description', 'bedrooms', 'bathrooms', 'status'];
    fields.forEach(field => { if (req.body[field]) property[field] = req.body[field]; });

    const updatedProperty = await property.save();
    res.json(updatedProperty);
});

export const deleteProperty = asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.agent.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    await property.deleteOne();
    res.json({ message: 'Property removed' });
});
>>>>>>> 13cfce60bcba9ce271b1e82291f36ef43abb7395
