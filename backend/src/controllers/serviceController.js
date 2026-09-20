import Service from "../models/Service.js";

// GET /api/services
export const getServices = async (req, res) => {
  try {
    const services = await Service.find({
      isActive: true,
    }).sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get services error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch services",
    });
  }
};

// GET /api/services/:slug
export const getServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const service = await Service.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get service error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service",
    });
  }
};