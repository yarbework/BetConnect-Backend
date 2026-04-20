import User from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendApprovalEmail } from "../services/emailService.js";


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

  if (!agent) {
    return res.status(404).json({ message: "Agent not found" });
  }

  
  try {
    await sendApprovalEmail(agent.email, agent.name);
  } catch (error) {
    console.error(`Email failed to send to ${agent.email}:`, error);
    
  }

  res.json(agent);
});