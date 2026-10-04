// Must run AFTER authMiddleware (needs req.user to already be set).
// Restricts a route to logged-in users whose account role is "technician",
// i.e. RepairMithra partners.
const technicianMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "technician") {
    return res.status(403).json({
      success: false,
      message: "This action is only available to RepairMithra partners.",
    });
  }

  next();
};

export default technicianMiddleware;