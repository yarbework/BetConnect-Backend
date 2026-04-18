import User from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get pending agents
export const getPendingAgents = asyncHandler(async (req, res) => {
  const agents = await User.find({
      role: "agent",
      status: "pending"
    });

    res.json(agents);
  });

// Approve agent
export const approveAgent = asyncHandler(async (req, res) => {
  const agent = await User.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    res.json(agent);
  } );
