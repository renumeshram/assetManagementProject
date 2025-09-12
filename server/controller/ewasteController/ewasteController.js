import EwasteRecords from '../../models/EwasteRecords.js';
import Department from '../../models/Department.js';
import mongoose from 'mongoose';

/**
 * Creates date filter based on time period
 * @param {Object} params - Filter parameters
 * @returns {Object} Date filter object
 */
function createDateFilter(params) {
    const { period, year, month, startDate, endDate } = params;
    
    // Filter by specific month
    if (period === 'month' && year && month) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59);
        return { $gte: monthStart, $lte: monthEnd };
    }
    
    // Filter by entire year
    if (period === 'year' && year) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31, 23, 59, 59);
        return { $gte: yearStart, $lte: yearEnd };
    }
    
    // Filter by custom date range
    if (period === 'custom' && startDate && endDate) {
        const customStart = new Date(startDate);
        const customEnd = new Date(endDate + 'T23:59:59');
        return { $gte: customStart, $lte: customEnd };
    }
    
    return {}; // No date filter
}

/**
 * Creates filter for transaction type (generated/collected/both)
 * @param {string} type - Transaction type
 * @returns {Object} Status filter
 */
function createStatusFilter(type) {
    const filters = {
        generated: { status: 'generated' },
        collected: { status: 'collected' },
        both: { $or: [{ status: 'generated' }, { status: 'collected' }] }
    };
    
    return filters[type] || filters.both;
}

/**
 * Creates date condition for filtering records
 * @param {Object} dateFilter - Date filter object
 * @returns {Object} Date condition
 */
function createDateCondition(dateFilter) {
    if (!dateFilter || Object.keys(dateFilter).length === 0) {
        return {};
    }
    
    // For EwasteRecords, we filter by receiveDate
    return { receiveDate: dateFilter };
}

/**
 * Builds the aggregation pipeline for e-waste data using EwasteRecords
 * @param {Array} matchConditions - Array of match conditions
 * @returns {Array} MongoDB aggregation pipeline
 */
function buildAggregationPipeline(matchConditions) {
    return [
        // Step 1: Match e-waste records based on conditions
        { $match: { $and: matchConditions } },
        
        // Step 2: Get asset details
        {
            $lookup: {
                from: 'assets',
                localField: 'assetId',
                foreignField: '_id',
                as: 'asset'
            }
        },
        { $unwind: '$asset' },
        
        // Step 3: Get asset category details
        {
            $lookup: {
                from: 'assetcategories',
                localField: 'asset.categoryId',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: '$category' },
        
        // Step 4: Get asset transaction details (if needed for department info)
        {
            $lookup: {
                from: 'assettransactions',
                localField: 'transactionId',
                foreignField: '_id',
                as: 'transaction'
            }
        },
        { $unwind: { path: '$transaction', preserveNullAndEmptyArrays: true } },
        
        // Step 5: Get department details
        {
            $lookup: {
                from: 'departments',
                localField: 'transaction.departmentId',
                foreignField: '_id',
                as: 'department'
            }
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        
        // Step 6: Add calculated fields
        {
            $addFields: {
                // Use existing totalWeight from EwasteRecords, or calculate if needed
                calculatedWeight: {
                    $cond: [
                        { $gt: ['$totalWeight', 0] },
                        '$totalWeight',
                        { $multiply: ['$quantity', '$asset.unitWeight'] }
                    ]
                },
                // Extract date components
                year: { $year: '$receiveDate' },
                month: { $month: '$receiveDate' }
            }
        },
        
        // Step 7: Group by status, department, category, and time
        {
            $group: {
                _id: {
                    status: '$status',
                    department: { 
                        $ifNull: ['$department.name', 'Unknown Department'] 
                    },
                    departmentId: '$transaction.departmentId',
                    category: '$category.name',
                    month: '$month',
                    year: '$year'
                },
                totalQuantity: { $sum: '$quantity' },
                totalWeight: { $sum: '$calculatedWeight' },
                recordCount: { $sum: 1 }
            }
        },
        
        // Step 8: Sort results
        {
            $sort: {
                '_id.year': -1,
                '_id.month': -1,
                '_id.department': 1
            }
        }
    ];
}

/**
 * Processes aggregation results into organized response
 * @param {Array} results - Aggregation results
 * @returns {Object} Organized response data
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
        }
    };

    results.forEach(item => {
        // Create clean record object
        const record = {
            department: item._id.department,
            departmentId: item._id.departmentId,
            category: item._id.category,
            month: item._id.month,
            year: item._id.year,
            quantity: item.totalQuantity,
            weight: item.totalWeight,
            recordCount: item.recordCount
        };

        // Add to appropriate category and update summary
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
 * Main function to get e-waste report using EwasteRecords
 */
export const getEwasteReport = async (req, res) => {
    try {
        // Extract query parameters with defaults
        const {
            type = 'both',
            period = 'month',
            year,
            month,
            startDate,
            endDate,
            departmentId
        } = req.query;

        // Build all filter conditions
        const dateFilter = createDateFilter({ period, year, month, startDate, endDate });
        const statusFilter = createStatusFilter(type);
        const dateCondition = createDateCondition(dateFilter);

        // Combine match conditions
        const matchConditions = [statusFilter, dateCondition]
            .filter(condition => Object.keys(condition).length > 0);

        // Add department filter if specified (this will be applied later in the pipeline)
        let departmentFilter = null;
        if (departmentId) {
            departmentFilter = new mongoose.Types.ObjectId(departmentId);
        }

        // Execute aggregation
        const pipeline = buildAggregationPipeline(matchConditions);
        
        // Add department filter after lookup if specified
        if (departmentFilter) {
            pipeline.splice(5, 0, {
                $match: { 'transaction.departmentId': departmentFilter }
            });
        }

        const results = await EwasteRecords.aggregate(pipeline);
        
        // Process and return results
        const processedData = processResults(results);

        res.json({
            success: true,
            data: processedData,
            filters: { type, period, year, month, startDate, endDate, departmentId },
            totalRecords: results.length
        });

    } catch (error) {
        console.error('Error generating e-waste report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating e-waste report',
            error: error.message
        });
    }
};

/**
 * Get list of active departments
 */
export const getDepartmentsList = async (req, res) => {
    try {
        const departments = await Department
            .find({ isActive: true })
            .select('name _id')
            .sort({ name: 1 });

        res.json({ 
            success: true, 
            data: departments 
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching departments',
            error: error.message
        });
    }
};

/**
 * Get chart data for e-waste visualization using EwasteRecords
 */
export const getEwasteChartData = async (req, res) => {
    try {
        const {
            period = 'month',
            year = new Date().getFullYear(),
            departmentId
        } = req.query;

        let dateRange;
        let groupBy;

        // Set up date range and grouping based on period
        if (period === 'month') {
            // Last 12 months data
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 11);

            dateRange = { $gte: startDate, $lte: endDate };
            groupBy = {
                year: { $year: '$receiveDate' },
                month: { $month: '$receiveDate' },
                status: '$status'
            };
        } else {
            // Last 5 years data
            const startYear = year - 4;
            const endYear = year;
            
            dateRange = {
                $gte: new Date(startYear, 0, 1),
                $lte: new Date(endYear, 11, 31)
            };
            groupBy = {
                year: { $year: '$receiveDate' },
                status: '$status'
            };
        }

        // Build match conditions
        const matchConditions = [
            { receiveDate: dateRange }
        ];

        // Build aggregation pipeline for chart data
        const pipeline = [
            { $match: { $and: matchConditions } },
            
            // Get asset details for weight calculation
            {
                $lookup: {
                    from: 'assets',
                    localField: 'assetId',
                    foreignField: '_id',
                    as: 'asset'
                }
            },
            { $unwind: '$asset' },
            
            // Get transaction details if department filter is needed
            {
                $lookup: {
                    from: 'assettransactions',
                    localField: 'transactionId',
                    foreignField: '_id',
                    as: 'transaction'
                }
            },
            { $unwind: { path: '$transaction', preserveNullAndEmptyArrays: true } },
            
            // Add department filter if specified
            ...(departmentId ? [{
                $match: { 'transaction.departmentId': new mongoose.Types.ObjectId(departmentId) }
            }] : []),
            
            // Calculate weight and group by time period and status
            {
                $addFields: {
                    calculatedWeight: {
                        $cond: [
                            { $gt: ['$totalWeight', 0] },
                            '$totalWeight',
                            { $multiply: ['$quantity', '$asset.unitWeight'] }
                        ]
                    }
                }
            },
            
            {
                $group: {
                    _id: groupBy,
                    totalWeight: { $sum: '$calculatedWeight' }
                }
            },
            
            // Sort chronologically
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1
                }
            }
        ];

        const results = await EwasteRecords.aggregate(pipeline);

        res.json({ 
            success: true, 
            data: results 
        });

    } catch (error) {
        console.error('Error generating chart data:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating chart data',
            error: error.message
        });
    }
};

/**
 * Create a new e-waste record
 */
export const createEwasteRecord = async (req, res) => {
    try {
        const {
            transactionId,
            assetId,
            quantity,
            totalWeight,
            receiveDate,
            status = 'generated'
        } = req.body;

        const newRecord = new EwasteRecords({
            transactionId,
            assetId,
            quantity,
            totalWeight,
            receiveDate: receiveDate || Date.now(),
            status
        });

        await newRecord.save();

        res.status(201).json({
            success: true,
            data: newRecord,
            message: 'E-waste record created successfully'
        });

    } catch (error) {
        console.error('Error creating e-waste record:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating e-waste record',
            error: error.message
        });
    }
};

/**
 * Update e-waste record status (e.g., from 'generated' to 'collected')
 */
export const updateEwasteRecordStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedRecord = await EwasteRecords.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({
                success: false,
                message: 'E-waste record not found'
            });
        }

        res.json({
            success: true,
            data: updatedRecord,
            message: 'E-waste record status updated successfully'
        });

    } catch (error) {
        console.error('Error updating e-waste record:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating e-waste record',
            error: error.message
        });
    }
};