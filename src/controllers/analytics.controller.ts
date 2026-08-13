import { Request, Response } from 'express';
import { Property } from '../models/Property.model';

export const getMarketStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pipeline = [
      { $match: { status: 'for-sale' } },
      {
        $group: {
          _id: '$address.city',
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { count: -1 as -1 } },
      { $limit: 8 },
    ];

    const stats = await Property.aggregate(pipeline);
    res.json({
      success: true,
      data: {
        cityStats: stats.map(s => ({
          city: s._id,
          avgPrice: Math.round(s.avgPrice),
          minPrice: s.minPrice,
          maxPrice: s.maxPrice,
          listings: s.count,
          avgRating: Math.round(s.avgRating * 10) / 10,
        })),
      },
    });
  } catch (error) {
    console.error('GetMarketStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch market stats' });
  }
};

export const getPriceTrends = async (_req: Request, res: Response): Promise<void> => {
  try {
    const typePipeline = [
      {
        $group: {
          _id: '$type',
          avgPrice: { $avg: '$price' },
          count: { $sum: 1 },
          avgSqft: { $avg: '$sqft' },
        },
      },
    ];

    const monthlyPipeline = [
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          avgPrice: { $avg: '$price' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ];

    const statusPipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
        },
      },
    ];

    const [typeStats, monthlyStats, statusStats] = await Promise.all([
      Property.aggregate(typePipeline),
      Property.aggregate(monthlyPipeline),
      Property.aggregate(statusPipeline),
    ]);

    const totalProperties = await Property.countDocuments();

    res.json({
      success: true,
      data: {
        typeStats: typeStats.map(t => ({
          type: t._id,
          avgPrice: Math.round(t.avgPrice),
          count: t.count,
          avgSqft: Math.round(t.avgSqft),
        })),
        monthlyTrends: monthlyStats.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          avgPrice: Math.round(m.avgPrice),
          listings: m.count,
        })),
        statusBreakdown: statusStats.map(s => ({
          status: s._id,
          count: s.count,
          avgPrice: Math.round(s.avgPrice),
        })),
        totalProperties,
      },
    });
  } catch (error) {
    console.error('GetPriceTrends error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch price trends' });
  }
};
