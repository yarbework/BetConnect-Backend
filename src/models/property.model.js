import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["house", "apartment", "land", "commercial"],
      required: true,
    },
<<<<<<< HEAD
=======
    bathrooms: {
        type: Number
    },
    
    isVerified: {
        type: Boolean,
        default: true
    },
    aiFlagged: {
        type: Boolean,
        default: false
    },
    
>>>>>>> 13cfce60bcba9ce271b1e82291f36ef43abb7395
    status: {
      type: String,
      enum: ["for_sale", "for_rent", "sold"],
      default: "for_sale",
    },
    images: [{ type: String }],
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    // GeoJSON Point — required for $near / $geoWithin queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        // [longitude, latitude]  — MongoDB uses lng first
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

// 2dsphere index enables geospatial queries
propertySchema.index({ location: "2dsphere" });

export default mongoose.model("Property", propertySchema);
