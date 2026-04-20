import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['apartment', 'house', 'villa', 'condo', 'studio', 'commercial', 'land'],
        required: true
    },
    floor: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    listingType: {
        type: String,
        enum: ['rent', 'sale'],
        required: true
    },
    images: [{
        type: String
    }],
    subcity: {
        type: String,
        required: true
    },
    woreda: {
        type: String,
        required: true
    },
    kebele: {
        type: String,
        required: true
    },
    specialName: {
        type: String
    },
    description: {
        type: String
    },
    aiDescription: {
        type: String
    },
    bedrooms: {
        type: Number
    },
    bathrooms: {
        type: Number
    },
    
    status: {
        type: String,
        enum: ['available', 'sold', 'rented'],
        default: 'available'
    }
}, { timestamps: true });

const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);
export default Property;

