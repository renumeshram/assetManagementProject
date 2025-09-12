import Inventory from '../../models/inventory.js';
import InventoryHistory from '../../models/inventoryHistory.js';

const getInventoryList = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const [inventory, total] = await Promise.all([
      Inventory.find()
        .populate('assetId', 'assetName')
        .skip(skip)
        .limit(limit),
      Inventory.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: inventory,
      total,
      page,
      limit,
      msg: 'Inventory fetched successfully.',
      statusCode: 200,
    })
  } catch (err) {
    console.log("🚀 ~ getInventoryList ~ err fetching inventory list:", err)
    return res.status(500).json({
      success: false,
      statusCode: 500,
      msg: 'Failed to fetch inventory.'
    })
  }
}

const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('assetId',)
      .populate('updatedBy', 'name sapId role');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        msg: 'Inventory item not found.'
      })
    }

    res.json({
      success: true,
      data: inventory,
      msg: 'Inventory item fetched successfully.',
      statusCode: 200,
    })
  } catch (err) {
    console.log("🚀 ~ getInventoryById ~ err fetching inventory by id:", err)
    return res.status(500).json({
      success: false,
      statusCode: 500,
      msg: 'Failed to fetch inventory item.'
    })
  }
}

// Update inventory
const updateInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const {
      reason,
      adjustmentQuantity = 0,
      minimumThreshold,
      description,
      notes
    } = req.body;

    // Get current inventory
    const currentInventory = await Inventory.findById(inventoryId);
    if (!currentInventory) {
      return res.status(404).json({
        success: false,
        msg: "Inventory item not found",
      });
    }

    // Store previous values for history
    const previousValues = {
      totalStock: currentInventory.totalStock,
      availableStock: currentInventory.availableStock,
      issuedStock: currentInventory.issuedStock,
      minimumThreshold: currentInventory.minimumThreshold,
    };

    // Parse numbers safely
    const qty = parseInt(adjustmentQuantity) || 0;
    let newTotalStock = currentInventory.totalStock;
    let newAvailableStock = currentInventory.availableStock;
    let newMinThreshold = currentInventory.minimumThreshold;

    // Apply business logic based on reason
    switch (reason) {
      case "restock":
        newTotalStock += qty;
        newAvailableStock += qty;

        // allow threshold update if provided
        if (minimumThreshold !== undefined && minimumThreshold !== null) {
          newMinThreshold = parseInt(minimumThreshold);
        }
        break;

      case "correction_increase":
        newAvailableStock += qty;
        break;

      case "correction_decrease":
        newAvailableStock = Math.max(0, newAvailableStock - qty);
        break;

      case "damage":
        newTotalStock = Math.max(0, newTotalStock - qty);
        newAvailableStock = Math.max(0, newAvailableStock - qty);
        break;

      case "maintenance":
        newAvailableStock = Math.max(0, newAvailableStock - qty);
        break;

      case "threshold_update":
        if (minimumThreshold !== undefined && minimumThreshold !== null) {
          newMinThreshold = parseInt(minimumThreshold);
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          msg: "Invalid reason provided",
        });
    }


    // Validate
    if (newAvailableStock > newTotalStock) {
      return res.status(400).json({
        success: false,
        msg: "Available stock cannot exceed total stock",
      });
    }
    if (newTotalStock < 0 || newAvailableStock < 0 || newMinThreshold < 0) {
      return res.status(400).json({
        success: false,
        msg: "Stock values cannot be negative",
      });
    }

    // Calculate issued stock
    const newIssuedStock = newTotalStock - newAvailableStock;

    // Update inventory
    const updatedInventory = await Inventory.findByIdAndUpdate(
      inventoryId,
      {
        totalStock: newTotalStock,
        availableStock: newAvailableStock,
        issuedStock: newIssuedStock,
        minimumThreshold: newMinThreshold,
        lastUpdated: new Date(),
        updatedBy: req.user ? req.user.id : null,
      },
      { new: true }
    );

    // Store new values for history
    const newValues = {
      totalStock: updatedInventory.totalStock,
      availableStock: updatedInventory.availableStock,
      issuedStock: updatedInventory.issuedStock,
      minimumThreshold: updatedInventory.minimumThreshold,
    };

    // Map reasons → descriptions
    const getReasonDescription = (reason) => {
      const descriptions = {
        restock: "New stock added to inventory",
        correction_increase: "Inventory count increased due to audit correction",
        correction_decrease: "Inventory count decreased due to audit correction",
        damage: "Assets removed due to damage or disposal",
        maintenance: "Assets temporarily unavailable for maintenance",
        threshold_update: "Minimum threshold updated",
      };
      return descriptions[reason] || reason;
    };

    // Create history record
    await InventoryHistory.create({
      inventoryId,
      assetId: currentInventory.assetId,
      action: reason,
      reason: getReasonDescription(reason),
      adjustmentQuantity: qty,
      description: description || "",
      previousValues,
      newValues,
      updatedBy: req.user ? req.user.id : null,
      notes: notes || "",
    });

    // Populate the response
    const populatedInventory = await Inventory.findById(inventoryId).populate(
      "assetId",
      "assetName"
    );

    res.json({
      success: true,
      data: populatedInventory,
      msg: "Inventory updated successfully",
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({
      success: false,
      msg: "Server error while updating inventory",
    });
  }
};


// Get inventory history
const getInventoryHistory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const history = await InventoryHistory.find({ inventoryId: inventoryId })
      .populate('updatedBy', 'name email')
      .populate('assetId', 'assetName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InventoryHistory.countDocuments({ inventoryId: inventoryId });

    res.json({
      success: true,
      data: history,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching inventory history:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while fetching inventory history'
    });
  }
};

// Get low stock alerts
const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$availableStock', '$minimumThreshold'] }
    })
      .populate('assetId', 'assetName assetCode')
      .sort({ availableStock: 1 });

    const formattedData = lowStockItems.map(item => ({
      _id: item._id,
      assetName: item.assetId.assetName,
      assetCode: item.assetId.assetCode,
      availableStock: item.availableStock,
      minimumThreshold: item.minimumThreshold,
      deficit: item.minimumThreshold - item.availableStock
    }));

    res.json({
      success: true,
      data: formattedData,
      count: formattedData.length
    });

  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while fetching low stock alerts'
    });
  }
};

// Create inventory for new asset
const createInventory = async (req, res) => {
  try {
    const {
      assetId,
      totalStock,
      availableStock,
      minimumThreshold
    } = req.body;

    // Check if inventory already exists for this asset
    const existingInventory = await Inventory.findOne({ assetId: assetId });
    if (existingInventory) {
      return res.status(400).json({
        success: false,
        msg: 'Inventory already exists for this asset'
      });
    }

    const newTotalStock = parseInt(totalStock) || 0;
    const newAvailableStock = parseInt(availableStock) || 0;
    const newMinThreshold = parseInt(minimumThreshold) || 0;
    const newIssuedStock = newTotalStock - newAvailableStock;

    const inventory = new Inventory({
      assetId: assetId,
      totalStock: newTotalStock,
      availableStock: newAvailableStock,
      issuedStock: newIssuedStock,
      minimumThreshold: newMinThreshold,
      updatedBy: req.user ? req.user.id : null
    });

    await inventory.save();

    // Create initial history record
    await InventoryHistory.create({
      inventoryId: inventory._id,
      assetId: assetId,
      action: 'initial_setup',
      reason: 'Initial inventory setup',
      adjustmentQuantity: newTotalStock,
      previousValues: {
        totalStock: 0,
        availableStock: 0,
        issuedStock: 0,
        minimumThreshold: 0
      },
      newValues: {
        totalStock: inventory.totalStock,
        availableStock: inventory.availableStock,
        issuedStock: inventory.issuedStock,
        minimumThreshold: inventory.minimumThreshold
      },
      updatedBy: req.user ? req.user.id : null
    });

    const populatedInventory = await Inventory.findById(inventory._id)
      .populate('assetId', 'assetName assetCode');

    res.status(201).json({
      success: true,
      data: populatedInventory,
      msg: 'Inventory created successfully'
    });

  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while creating inventory'
    });
  }
};

export {
  getInventoryList,
  getInventoryById,
  updateInventory,
  getInventoryHistory,
  getLowStockAlerts,
  createInventory,
}