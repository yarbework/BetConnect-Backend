import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["house", "apartment", "villa", "condo", "studio", "commercial", "land"],
      required: true,
      lowercase: true,
    },
    size: {
      type: Number, 
      required: true,
    },
    floor: {
      type: String, 
      required: true,
    },
    bedrooms: {
      type: Number,
      default: 0,
    },
    bathrooms: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    listingType: {
      type: String,
      enum: ["rent", "sale"],
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "sold", "rented"],
      default: "available",
    },
    subcity: {
      type: String,
      required: true,
      trim: true,
    },
    woreda: {
      type: String,
      required: true,
    },
    kebele: {
      type: String,
      required: true,
    },
    specialName: {
      type: String, 
      trim: true,
    },
    description: {
      type: String, 
    },
    aiDescription: {
      type: String, 
    },
    images: [{ type: String }],
    aiFlagged: {
      type: Boolean,
      default: false, 
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], 
        index: "2dsphere", 
      },
    },
  },
  { timestamps: true }
);

// This index allows the "Find Nearby Houses" feature to work
propertySchema.index({ location: "2dsphere" });

export default mongoose.models.Property || mongoose.model("Property", propertySchema);