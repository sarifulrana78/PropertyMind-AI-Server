import { Request, Response } from 'express';
import { Property } from '../models/Property.model';
import { Review } from '../models/Review.model';
import { AuthRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

export const getProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search, type, status, city, minPrice, maxPrice,
      minBeds, maxBeds, sortBy = 'createdAt', sortOrder = 'desc',
      page = '1', limit = '12', featured,
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = Number(maxPrice);
    }
    if (minBeds) filter.bedrooms = { $gte: Number(minBeds) };
    if (maxBeds) {
      filter.bedrooms = { ...(filter.bedrooms as object || {}), $lte: Number(maxBeds) };
    }
    if (featured === 'true') filter.isFeatured = true;

    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name avatar email'),
      Property.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('GetProperties error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch properties' });
  }
};

export const getProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('owner', 'name avatar email phone');

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }

    // Get reviews
    const reviews = await Review.find({ property: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get related properties (same city, different id)
    const related = await Property.find({
      'address.city': property.address.city,
      _id: { $ne: property._id },
    }).limit(4).select('title price images address type bedrooms bathrooms rating');

    res.json({ success: true, data: { property, reviews, related } });
  } catch (error) {
    console.error('GetProperty error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch property' });
  }
};

export const createProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const propertyData = { ...req.body, owner: req.user?.id };
    const property = await Property.create(propertyData);
    await property.populate('owner', 'name avatar email');
    res.status(201).json({ success: true, message: 'Property listed successfully', data: { property } });
  } catch (error) {
    console.error('CreateProperty error:', error);
    res.status(500).json({ success: false, message: 'Failed to create property' });
  }
};

export const updateProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }
    if (property.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to update this property' });
      return;
    }
    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: { property: updated } });
  } catch (error) {
    console.error('UpdateProperty error:', error);
    res.status(500).json({ success: false, message: 'Failed to update property' });
  }
};

export const deleteProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }
    if (property.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
      return;
    }
    await Property.findByIdAndDelete(req.params.id);
    await Review.deleteMany({ property: req.params.id });
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('DeleteProperty error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete property' });
  }
};

export const getMyProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const properties = await Property.find({ owner: req.user?.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { properties } });
  } catch (error) {
    console.error('GetMyProperties error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your properties' });
  }
};

export const addReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body;
    const propertyId = req.params.id;

    const existing = await Review.findOne({ property: propertyId, user: req.user?.id });
    if (existing) {
      res.status(409).json({ success: false, message: 'You have already reviewed this property' });
      return;
    }

    const review = await Review.create({ property: propertyId, user: req.user?.id, rating, comment });
    await review.populate('user', 'name avatar');

    // Update property rating
    const reviews = await Review.find({ property: propertyId });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await Property.findByIdAndUpdate(propertyId, { rating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length });

    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    console.error('AddReview error:', error);
    res.status(500).json({ success: false, message: 'Failed to add review' });
  }
};

export const getFeaturedProperties = async (_req: Request, res: Response): Promise<void> => {
  try {
    const properties = await Property.find({ isFeatured: true }).limit(8).populate('owner', 'name avatar');
    res.json({ success: true, data: { properties } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured properties' });
  }
};
