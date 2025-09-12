
import Request from '../../models/request.js';

const getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming userId is stored in session
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch user requests from the database
    const requests = await Request.find({ requestorId: userId }).populate('assetId'); // Assuming RequestModel is defined and has a userId field

    if (!requests || requests.length === 0) {
      return res.status(404).json({ message: "No requests found for this user" });
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export { getUserRequests };