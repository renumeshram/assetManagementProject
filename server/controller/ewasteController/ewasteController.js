import EwasteRecords from '../../models/ewasteRecords.js';
import Department from '../../models/department.js';
import Section from '../../models/section.js';
import mongoose from 'mongoose';

/**
 * Creates date filter based on time period
 */
function createDateFilter({ period, year, month, startDate, endDate }) {
  if (period === 'month' && year && month) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    return { $gte: monthStart, $lte: monthEnd };
  }
  if (period === 'year' && year) {
    return { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) };
  }
  if (period === 'custom' && startDate && endDate) {
    return { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
  }
  return {};
}

/**
 * Creates status filter
 */
function createStatusFilter(type) {
  const filters = {
    generated: { status: 'generated' },
    collected: { status: 'collected' },
    both: { $or: [{ status: 'generated' }, { status: 'collected' }] },
  };
  return filters[type] || filters.both;
}

/**
 * Builds aggregation pipeline with proper filtering order
 */
function buildAggregationPipeline(matchConditions, locationId, departmentId, sectionId) {
  const pipeline = [
    { $match: { $and: matchConditions } },

    // Asset details (required)
    { $lookup: { from: 'assets', localField: 'assetId', foreignField: '_id', as: 'asset' } },
    { $unwind: '$asset' },  // Assumes assetId always present

    // Asset category
    { $lookup: { from: 'assetcategories', localField: 'asset.categoryId', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },

    // Transaction details (optional)
    { $lookup: { from: 'assettransactions', localField: 'transactionId', foreignField: '_id', as: 'transaction' } },
    { $unwind: { path: '$transaction', preserveNullAndEmptyArrays: true } },

    // Add coalesced fields: Use transaction fields if present, else fallback (e.g., ewaste.locationId for location)
    {
      $addFields: {
        effectiveLocationId: {
          $cond: [
            { $ifNull: ['$transaction.locationId', false] },
            '$transaction.locationId',
            '$locationId'  // Fallback to ewaste.locationId if no transaction
          ]
        },
        effectiveDepartmentId: {
          $cond: [
            { $ifNull: ['$transaction.departmentId', false] },
            '$transaction.departmentId',
            null  // Or 'Unknown' ObjectId if needed; adjust if ewaste has direct dept
          ]
        },
        effectiveSectionId: {
          $cond: [
            { $ifNull: ['$transaction.sectionId', false] },
            '$transaction.sectionId',
            null  // Same as above
          ]
        }
      }
    },

    // Now filter on effective fields (only if specified and not 'all')
    ...(locationId && locationId !== 'all' && locationId !== ''
      ? [{ $match: { effectiveLocationId: new mongoose.Types.ObjectId(locationId) } }]
      : []),
    ...(departmentId && departmentId !== 'all' && departmentId !== ''
      ? [{ $match: { effectiveDepartmentId: new mongoose.Types.ObjectId(departmentId) } }]
      : []),
    ...(sectionId && sectionId !== 'all' && sectionId !== ''
      ? [{ $match: { effectiveSectionId: new mongoose.Types.ObjectId(sectionId) } }]
      : []),

    // Department details (lookup on effectiveDepartmentId)
    { $lookup: { from: 'departments', localField: 'effectiveDepartmentId', foreignField: '_id', as: 'department' } },
    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },

    // Section details
    { $lookup: { from: 'sections', localField: 'effectiveSectionId', foreignField: '_id', as: 'section' } },
    { $unwind: { path: '$section', preserveNullAndEmptyArrays: true } },

    // Calculated fields
    {
      $addFields: {
        calculatedWeight: {
          $cond: [
            { $gt: ['$totalWeight', 0] },
            '$totalWeight',
            { $multiply: ['$quantity', '$asset.unitWeight'] },
          ],
        },
        year: { $year: '$receiveDate' },
        month: { $month: '$receiveDate' },
      },
    },

    // Grouping
    {
      $group: {
        _id: {
          status: '$status',
          department: { $ifNull: ['$department.name', 'Unknown Department'] },
          departmentId: '$department._id',
          section: { $ifNull: ['$section.name', 'All Sections'] },
          sectionId: '$section._id',
          category: '$category.name',
          month: '$month',
          year: '$year',
        },
        totalQuantity: { $sum: '$quantity' },
        totalWeight: { $sum: '$calculatedWeight' },
        recordCount: { $sum: 1 },
      },
    },

    { $sort: { '_id.year': -1, '_id.month': -1, '_id.department': 1, '_id.section': 1, '_id.category': 1 } }
  ];

  return pipeline;
}

/**
 * Processes aggregation results
 */
function processResults(results) {
  const response = {
    generated: [],
    collected: [],
    summary: { 
      totalGeneratedWeight: 0, 
      totalCollectedWeight: 0, 
      totalGeneratedQuantity: 0, 
      totalCollectedQuantity: 0 
    },
  };

  results.forEach((item) => {
    const record = {
      department: item._id.department,
      departmentId: item._id.departmentId,
      section: item._id.section,
      sectionId: item._id.sectionId,
      category: item._id.category,
      month: item._id.month,
      year: item._id.year,
      quantity: item.totalQuantity,
      weight: item.totalWeight,
      recordCount: item.recordCount,
    };

    if (item._id.status === 'generated') {
      response.generated.push(record);
      response.summary.totalGeneratedWeight += item.totalWeight;
      response.summary.totalGeneratedQuantity += item.totalQuantity;
    } else {
      response.collected.push(record);
      response.summary.totalCollectedWeight += item.totalWeight;
      response.summary.totalCollectedQuantity += item.totalQuantity;
    }
  });

  return response;
}

/**
 * Get E-waste Report
 */
export const getEwasteReport = async (req, res) => {
  try {
    const {
      type = 'both',
      period = 'month',
      year,
      month,
      startDate,
      endDate,
      location,
      department,
      section,
    } = req.query;

    const user = req.user; // Get user from auth middleware

    console.log('Report filters:', { type, period, year, month, startDate, endDate, location, department, section });
    console.log('User role:', user.role, 'User location:', user.locationId, 'Assigned location:', user.assignedLocationId);

    const dateFilter = createDateFilter({ period, year, month, startDate, endDate });
    const statusFilter = createStatusFilter(type);
    
    // Build match conditions
    const matchConditions = [statusFilter];
    
    // Add date filter if it exists
    if (Object.keys(dateFilter).length > 0) {
      matchConditions.push({ receiveDate: dateFilter });
    }

    // Handle location filtering based on user role
    let effectiveLocationId = location;
    
    if (user.role === 'admin' && !location) {
      // Admin should use their assigned location if no location specified
      effectiveLocationId = user.assignedLocationId;
    } else if ((user.role === 'manager' || user.role === 'user') && !location) {
      // Manager/User should use their location if no location specified
      effectiveLocationId = user.locationId;
    }

    console.log('Effective location ID:', effectiveLocationId);
    // console.log('Match conditions:', JSON.stringify(matchConditions, null, 2));

    // Build pipeline with filters in the correct order
    const pipeline = buildAggregationPipeline(matchConditions, effectiveLocationId, department, section);

    console.log('Aggregation pipeline:', JSON.stringify(pipeline, null, 2));

    const results = await EwasteRecords.aggregate(pipeline);

    console.log('Aggregation results count:', results.length);

    // Check if no results found
    if (results.length === 0) {
      return res.json({
        success: true,
        data: {
          generated: [],
          collected: [],
          summary: { 
            totalGeneratedWeight: 0, 
            totalCollectedWeight: 0, 
            totalGeneratedQuantity: 0, 
            totalCollectedQuantity: 0 
          },
        },
        message: 'No records found for the selected criteria',
        filters: { type, period, year, month, startDate, endDate, location: effectiveLocationId, department, section },
        totalRecords: 0,
      });
    }

    const processedData = processResults(results);

    res.json({
      success: true,
      data: processedData,
      filters: { type, period, year, month, startDate, endDate, location: effectiveLocationId, department, section },
      totalRecords: results.length,
    });
  } catch (error) {
    console.error('Error generating e-waste report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating e-waste report',
      error: error.message,
    });
  }
};

/**
 * Get active departments
 */
export const getDepartmentsList = async (req, res) => {
  try {
    const { locationId } = req.query;
    let query = { isActive: true };
    
    // If locationId is provided and not 'all', filter by location
    if (locationId && locationId !== 'all' && locationId !== '') {
      query.locationId = new mongoose.Types.ObjectId(locationId);
    }
    
    const departments = await Department.find(query).select('name _id locationId').sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching departments', error: error.message });
  }
};

/**
 * Get active sections for a department
 */
export const getSectionsList = async (req, res) => {
  try {
    const { departmentId } = req.query;
    let query = {};
    
    // If departmentId is provided and not 'all', filter by department
    if (departmentId && departmentId !== 'all' && departmentId !== '') {
      query.departmentId = new mongoose.Types.ObjectId(departmentId);
    }
    
    const sections = await Section.find(query).select('name _id departmentId').sort({ name: 1 });
    res.json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sections', error: error.message });
  }
};