import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.model';
import { Property } from '../models/Property.model';
import { Review } from '../models/Review.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/propertymind';

const propertyImages = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
  'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800&q=80',
];

const seedData = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Property.deleteMany({});
  await Review.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('Demo@1234', 12);
  const users = await User.create([
    {
      name: 'Demo User',
      email: 'demo@propertymind.ai',
      password: hashedPassword,
      role: 'user',
      provider: 'credentials',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah@propertymind.ai',
      password: hashedPassword,
      role: 'agent',
      provider: 'credentials',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    },
    {
      name: 'Michael Chen',
      email: 'michael@propertymind.ai',
      password: hashedPassword,
      role: 'agent',
      provider: 'credentials',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
    },
    {
      name: 'Emma Williams',
      email: 'emma@propertymind.ai',
      password: hashedPassword,
      role: 'user',
      provider: 'credentials',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    },
  ]);
  console.log(`✅ Created ${users.length} users`);

  const propertiesData = [
    // Austin, TX
    {
      title: 'Modern Luxury Villa with Pool',
      description: 'Stunning modern villa featuring an open-concept design, gourmet kitchen, and resort-style backyard with infinity pool. Perfect for entertaining.',
      aiDescription: 'Welcome to this architectural masterpiece where contemporary design meets luxury living. This stunning villa features floor-to-ceiling windows that flood the space with natural light, a chef-inspired kitchen with premium appliances, and seamless indoor-outdoor flow leading to your private infinity pool.',
      price: 1250000,
      address: { street: '123 Lakeside Drive', city: 'Austin', state: 'TX', zipCode: '78701' },
      type: 'villa',
      status: 'for-sale',
      bedrooms: 5, bathrooms: 4, sqft: 4200, yearBuilt: 2021, parking: 3,
      amenities: ['Pool', 'Smart Home', 'Home Theater', 'Wine Cellar', 'Outdoor Kitchen', 'Solar Panels'],
      images: [propertyImages[0], propertyImages[1], propertyImages[2], propertyImages[3]],
      owner: users[1]._id,
      rating: 4.9, reviewCount: 23, views: 1240, isFeatured: true,
      aiReport: { positioning: 'Premium luxury segment, priced competitively', targetBuyer: 'High-net-worth executives and tech entrepreneurs', predictedDaysToSell: 21, confidence: 0.92, generatedAt: new Date() },
    },
    {
      title: 'Downtown Austin Penthouse',
      description: 'Spectacular penthouse with panoramic city views, private rooftop terrace, and premium finishes throughout.',
      price: 890000,
      address: { street: '456 Congress Ave', city: 'Austin', state: 'TX', zipCode: '78701' },
      type: 'condo',
      status: 'for-sale',
      bedrooms: 3, bathrooms: 3, sqft: 2800, yearBuilt: 2019, parking: 2,
      amenities: ['Rooftop Terrace', 'Concierge', 'Gym', 'Valet Parking', '24/7 Security'],
      images: [propertyImages[1], propertyImages[4], propertyImages[5]],
      owner: users[2]._id,
      rating: 4.7, reviewCount: 15, views: 890, isFeatured: true,
    },
    {
      title: 'Charming East Austin Bungalow',
      description: 'Beautifully renovated craftsman bungalow in the heart of East Austin. Walking distance to best restaurants and bars.',
      price: 685000,
      address: { street: '789 Manor Road', city: 'Austin', state: 'TX', zipCode: '78702' },
      type: 'house',
      status: 'for-sale',
      bedrooms: 3, bathrooms: 2, sqft: 1850, yearBuilt: 1952, parking: 1,
      amenities: ['Renovated Kitchen', 'Original Hardwood Floors', 'Large Yard', 'Covered Porch'],
      images: [propertyImages[6], propertyImages[7]],
      owner: users[0]._id,
      rating: 4.5, reviewCount: 8, views: 620, isFeatured: false,
    },
    {
      title: 'South Congress Modern Home',
      description: 'Brand new construction on South Congress with designer finishes, open floor plan, and dedicated home office.',
      price: 950000,
      address: { street: '321 South Congress Ave', city: 'Austin', state: 'TX', zipCode: '78704' },
      type: 'house',
      status: 'for-sale',
      bedrooms: 4, bathrooms: 3, sqft: 3100, yearBuilt: 2023, parking: 2,
      amenities: ['Home Office', 'Designer Kitchen', 'EV Charger', 'Smart Home', 'Private Pool'],
      images: [propertyImages[2], propertyImages[3], propertyImages[8]],
      owner: users[1]._id,
      rating: 4.8, reviewCount: 12, views: 780, isFeatured: true,
    },
    // Miami, FL
    {
      title: 'Brickell Luxury Apartment',
      description: 'Ultra-luxury apartment in Miami\'s financial district with bay views, resort amenities, and world-class concierge services.',
      price: 1450000,
      address: { street: '100 Brickell Ave', city: 'Miami', state: 'FL', zipCode: '33131' },
      type: 'apartment',
      status: 'for-sale',
      bedrooms: 3, bathrooms: 3, sqft: 2200, yearBuilt: 2020, parking: 2,
      amenities: ['Bay View', 'Infinity Pool', 'Spa', 'Private Beach Access', 'Valet', 'Gym'],
      images: [propertyImages[4], propertyImages[5], propertyImages[9]],
      owner: users[2]._id,
      rating: 4.9, reviewCount: 31, views: 1650, isFeatured: true,
    },
    {
      title: 'Coconut Grove Waterfront Villa',
      description: 'Exceptional waterfront villa with private dock, tropical landscaping, and breathtaking Biscayne Bay views.',
      price: 3200000,
      address: { street: '25 Bayshore Dr', city: 'Miami', state: 'FL', zipCode: '33133' },
      type: 'villa',
      status: 'for-sale',
      bedrooms: 6, bathrooms: 5, sqft: 6500, yearBuilt: 2018, parking: 4,
      amenities: ['Private Dock', 'Pool', 'Guest House', 'Home Theater', 'Wine Cellar', 'Smart Home'],
      images: [propertyImages[0], propertyImages[9], propertyImages[10]],
      owner: users[1]._id,
      rating: 5.0, reviewCount: 7, views: 2100, isFeatured: true,
    },
    {
      title: 'Wynwood Arts District Loft',
      description: 'Industrial-chic loft in Miami\'s most vibrant arts district. Exposed brick, 14-foot ceilings, and artist studio space.',
      price: 620000,
      address: { street: '2200 NW 2nd Ave', city: 'Miami', state: 'FL', zipCode: '33127' },
      type: 'apartment',
      status: 'for-sale',
      bedrooms: 2, bathrooms: 2, sqft: 1400, yearBuilt: 2016, parking: 1,
      amenities: ['Artist Studio', 'Exposed Brick', 'Rooftop Access', 'Bike Storage'],
      images: [propertyImages[11], propertyImages[6]],
      owner: users[3]._id,
      rating: 4.3, reviewCount: 19, views: 540, isFeatured: false,
    },
    // New York, NY
    {
      title: 'Upper West Side Classic Brownstone',
      description: 'Gorgeous pre-war townhouse with original details, private garden, and highly desirable Upper West Side location.',
      price: 4500000,
      address: { street: '234 West 85th St', city: 'New York', state: 'NY', zipCode: '10024' },
      type: 'house',
      status: 'for-sale',
      bedrooms: 5, bathrooms: 4, sqft: 4800, yearBuilt: 1912, parking: 0,
      amenities: ['Private Garden', 'Original Details', 'Renovated Kitchen', 'Library', 'Wine Cellar'],
      images: [propertyImages[7], propertyImages[8], propertyImages[1]],
      owner: users[2]._id,
      rating: 4.8, reviewCount: 9, views: 1890, isFeatured: true,
    },
    {
      title: 'Chelsea Modern Condo',
      description: 'Sleek and sophisticated condo in Chelsea with high-end finishes, floor-to-ceiling windows, and Manhattan skyline views.',
      price: 2100000,
      address: { street: '456 West 22nd St', city: 'New York', state: 'NY', zipCode: '10011' },
      type: 'condo',
      status: 'for-sale',
      bedrooms: 2, bathrooms: 2, sqft: 1650, yearBuilt: 2017, parking: 1,
      amenities: ['Doorman', 'Gym', 'Rooftop Deck', 'Storage', 'Bike Room'],
      images: [propertyImages[5], propertyImages[4], propertyImages[11]],
      owner: users[1]._id,
      rating: 4.6, reviewCount: 14, views: 1120, isFeatured: false,
    },
    {
      title: 'Brooklyn Heights Apartment',
      description: 'Spacious apartment in the prestigious Brooklyn Heights neighborhood with Manhattan Bridge views and classic details.',
      price: 1350000,
      address: { street: '18 Montague Terrace', city: 'New York', state: 'NY', zipCode: '11201' },
      type: 'apartment',
      status: 'for-sale',
      bedrooms: 3, bathrooms: 2, sqft: 1900, yearBuilt: 1925, parking: 0,
      amenities: ['Bridge View', 'Pre-War Details', 'Updated Kitchen', 'Laundry In-Unit'],
      images: [propertyImages[3], propertyImages[9]],
      owner: users[0]._id,
      rating: 4.4, reviewCount: 11, views: 780, isFeatured: false,
    },
    // Los Angeles, CA
    {
      title: 'Hollywood Hills Mansion',
      description: 'Iconic Hollywood Hills estate with canyon views, resort-style pool, and celebrity-worthy entertainment spaces.',
      price: 5800000,
      address: { street: '1 Mulholland Drive', city: 'Los Angeles', state: 'CA', zipCode: '90046' },
      type: 'villa',
      status: 'for-sale',
      bedrooms: 7, bathrooms: 8, sqft: 8500, yearBuilt: 2015, parking: 6,
      amenities: ['Canyon View', 'Infinity Pool', 'Recording Studio', 'Gym', 'Guest House', 'Tennis Court'],
      images: [propertyImages[10], propertyImages[0], propertyImages[2], propertyImages[5]],
      owner: users[2]._id,
      rating: 4.9, reviewCount: 5, views: 3200, isFeatured: true,
    },
    {
      title: 'Santa Monica Beachfront Condo',
      description: 'Rare beachfront condo steps from Santa Monica Pier with ocean views from every room and private beach access.',
      price: 2800000,
      address: { street: '1 Ocean Ave', city: 'Los Angeles', state: 'CA', zipCode: '90401' },
      type: 'condo',
      status: 'for-sale',
      bedrooms: 3, bathrooms: 3, sqft: 2400, yearBuilt: 2019, parking: 2,
      amenities: ['Ocean View', 'Private Beach Access', 'Pool', 'Spa', 'Concierge'],
      images: [propertyImages[1], propertyImages[4], propertyImages[8]],
      owner: users[1]._id,
      rating: 4.8, reviewCount: 18, views: 2450, isFeatured: true,
    },
    {
      title: 'Silver Lake Modern Home',
      description: 'Architect-designed home in hip Silver Lake with rooftop deck, chef\'s kitchen, and stunning city views.',
      price: 1750000,
      address: { street: '567 Effie St', city: 'Los Angeles', state: 'CA', zipCode: '90026' },
      type: 'house',
      status: 'for-sale',
      bedrooms: 4, bathrooms: 3, sqft: 2900, yearBuilt: 2022, parking: 2,
      amenities: ['Rooftop Deck', "Chef's Kitchen", 'City View', 'EV Charger', 'Smart Home'],
      images: [propertyImages[6], propertyImages[7], propertyImages[3]],
      owner: users[3]._id,
      rating: 4.7, reviewCount: 22, views: 1560, isFeatured: false,
    },
    // Chicago, IL
    {
      title: 'Lincoln Park Victorian Greystone',
      description: 'Magnificently restored Victorian greystone in Lincoln Park with original mahogany millwork and modern updates.',
      price: 1850000,
      address: { street: '2045 N Lincoln Ave', city: 'Chicago', state: 'IL', zipCode: '60614' },
      type: 'house',
      status: 'for-sale',
      bedrooms: 5, bathrooms: 4, sqft: 4100, yearBuilt: 1895, parking: 2,
      amenities: ['Original Millwork', 'Chef Kitchen', 'English Garden', 'Finished Basement', 'Garage'],
      images: [propertyImages[9], propertyImages[10], propertyImages[11]],
      owner: users[1]._id,
      rating: 4.6, reviewCount: 7, views: 890, isFeatured: false,
    },
    {
      title: 'River North Luxury Apartment',
      description: 'Contemporary high-rise apartment in River North with panoramic Chicago River views and premium building amenities.',
      price: 780000,
      address: { street: '333 N Canal St', city: 'Chicago', state: 'IL', zipCode: '60606' },
      type: 'apartment',
      status: 'for-sale',
      bedrooms: 2, bathrooms: 2, sqft: 1500, yearBuilt: 2021, parking: 1,
      amenities: ['River View', 'Pool', 'Gym', 'Dog Run', 'Bike Storage', 'Rooftop'],
      images: [propertyImages[4], propertyImages[6]],
      owner: users[2]._id,
      rating: 4.5, reviewCount: 28, views: 1100, isFeatured: false,
    },
    // For Rent
    {
      title: 'Austin High-Rise Apartment for Rent',
      description: 'Stunning high-rise apartment with cityscape views, available for rent in a prime downtown location.',
      price: 4500,
      address: { street: '400 W 2nd St', city: 'Austin', state: 'TX', zipCode: '78701' },
      type: 'apartment',
      status: 'for-rent',
      bedrooms: 2, bathrooms: 2, sqft: 1200, yearBuilt: 2020, parking: 1,
      amenities: ['Gym', 'Pool', 'Concierge', 'Pet Friendly', 'Balcony'],
      images: [propertyImages[2], propertyImages[5]],
      owner: users[1]._id,
      rating: 4.4, reviewCount: 36, views: 960, isFeatured: false,
    },
    {
      title: 'Miami Beach Luxury Rental',
      description: 'Exquisite beachfront rental in South Beach with private pool, ocean view, and full concierge services.',
      price: 12000,
      address: { street: '1 Collins Ave', city: 'Miami', state: 'FL', zipCode: '33139' },
      type: 'villa',
      status: 'for-rent',
      bedrooms: 4, bathrooms: 4, sqft: 3500, yearBuilt: 2018, parking: 2,
      amenities: ['Private Pool', 'Ocean View', 'Concierge', 'Chef Kitchen', 'Smart Home'],
      images: [propertyImages[8], propertyImages[0], propertyImages[3]],
      owner: users[2]._id,
      rating: 4.9, reviewCount: 12, views: 1880, isFeatured: true,
    },
    {
      title: 'Seattle Capitol Hill Craftsman',
      description: 'Beautiful craftsman home in Capitol Hill with stunning renovations, original character, and a large private yard.',
      price: 1050000,
      address: { street: '1234 E Pine St', city: 'Seattle', state: 'WA', zipCode: '98122' },
      type: 'house',
      status: 'for-sale',
      bedrooms: 4, bathrooms: 3, sqft: 2700, yearBuilt: 1928, parking: 1,
      amenities: ['Original Craftsman Details', 'Updated Kitchen', 'Large Yard', 'Office', 'Deck'],
      images: [propertyImages[11], propertyImages[7], propertyImages[6]],
      owner: users[3]._id,
      rating: 4.5, reviewCount: 10, views: 720, isFeatured: false,
    },
    {
      title: 'Denver Tech Center Modern Condo',
      description: 'Sleek contemporary condo in Denver\'s tech hub with mountain views, modern design, and proximity to top employers.',
      price: 575000,
      address: { street: '5600 Greenwood Plaza Blvd', city: 'Denver', state: 'CO', zipCode: '80111' },
      type: 'condo',
      status: 'for-sale',
      bedrooms: 2, bathrooms: 2, sqft: 1350, yearBuilt: 2022, parking: 1,
      amenities: ['Mountain View', 'Gym', 'Rooftop', 'EV Charger', 'Pet Friendly'],
      images: [propertyImages[1], propertyImages[4], propertyImages[10]],
      owner: users[0]._id,
      rating: 4.6, reviewCount: 17, views: 830, isFeatured: false,
    },
    {
      title: 'Nashville Music Row Victorian',
      description: 'Iconic Victorian home steps from Music Row, fully updated with designer touches while preserving historic charm.',
      price: 925000,
      address: { street: '17 Division St', city: 'Nashville', state: 'TN', zipCode: '37203' },
      type: 'house',
      status: 'for-sale',
      bedrooms: 4, bathrooms: 3, sqft: 2950, yearBuilt: 1898, parking: 2,
      amenities: ['Music Studio', 'Vintage Details', 'Renovated Kitchen', 'Wraparound Porch'],
      images: [propertyImages[9], propertyImages[11], propertyImages[0]],
      owner: users[1]._id,
      rating: 4.7, reviewCount: 13, views: 1090, isFeatured: false,
    },
    {
      title: 'Phoenix Desert Modern Estate',
      description: 'Stunning desert contemporary estate with breathtaking Sonoran Desert and mountain views, infinity pool, and smart home integration.',
      price: 2100000,
      address: { street: '15000 N Paradise Drive', city: 'Phoenix', state: 'AZ', zipCode: '85022' },
      type: 'villa',
      status: 'for-sale',
      bedrooms: 5, bathrooms: 5, sqft: 5200, yearBuilt: 2020, parking: 3,
      amenities: ['Desert View', 'Infinity Pool', 'Casita', 'Smart Home', 'Outdoor Kitchen', 'Fire Pit'],
      images: [propertyImages[5], propertyImages[3], propertyImages[8], propertyImages[2]],
      owner: users[2]._id,
      rating: 4.8, reviewCount: 21, views: 1740, isFeatured: true,
    },
    {
      title: 'Boston Beacon Hill Historic Condo',
      description: 'Charming historic condo on iconic Beacon Hill with gas lanterns outside and modern luxury within.',
      price: 1680000,
      address: { street: '75 Chestnut St', city: 'Boston', state: 'MA', zipCode: '02108' },
      type: 'condo',
      status: 'for-sale',
      bedrooms: 2, bathrooms: 2, sqft: 1600, yearBuilt: 1875, parking: 0,
      amenities: ['Historic Charm', 'Gas Fireplaces', 'Private Deck', 'In-Unit Laundry'],
      images: [propertyImages[7], propertyImages[9]],
      owner: users[3]._id,
      rating: 4.5, reviewCount: 16, views: 960, isFeatured: false,
    },
    {
      title: 'San Francisco Pacific Heights Flat',
      description: 'Grand Pacific Heights flat with bay and bridge views, period details, and a prime SF location.',
      price: 3100000,
      address: { street: '2200 Broadway St', city: 'San Francisco', state: 'CA', zipCode: '94115' },
      type: 'apartment',
      status: 'for-sale',
      bedrooms: 4, bathrooms: 3, sqft: 3200, yearBuilt: 1910, parking: 1,
      amenities: ['Bay View', 'Period Details', 'Chef Kitchen', 'Private Garden', 'Formal Dining Room'],
      images: [propertyImages[10], propertyImages[1], propertyImages[4]],
      owner: users[1]._id,
      rating: 4.9, reviewCount: 6, views: 2380, isFeatured: true,
    },
  ];

  const properties = await Property.create(propertiesData);
  console.log(`✅ Created ${properties.length} properties`);

  // Add sample reviews
  const reviewsData = [
    { property: properties[0]._id, user: users[3]._id, rating: 5, comment: 'Absolutely stunning property! The infinity pool is a dream and the views are incredible. Top-notch quality throughout.' },
    { property: properties[0]._id, user: users[0]._id, rating: 5, comment: 'One of the finest homes I have ever visited. The smart home integration is seamless and the outdoor kitchen is chef-grade.' },
    { property: properties[1]._id, user: users[3]._id, rating: 4, comment: 'Amazing penthouse with panoramic views. The rooftop terrace is perfect for entertaining. Highly recommend!' },
    { property: properties[4]._id, user: users[0]._id, rating: 5, comment: 'The Brickell apartment exceeded all expectations. The bay views are breathtaking and amenities are world-class.' },
    { property: properties[7]._id, user: users[0]._id, rating: 5, comment: 'The brownstone is a piece of NYC history. Beautifully maintained with all the original charm intact.' },
    { property: properties[10]._id, user: users[3]._id, rating: 5, comment: 'Hollywood Hills living is unmatched. The recording studio was a bonus we did not expect. Truly an iconic property.' },
    { property: properties[2]._id, user: users[2]._id, rating: 4, comment: 'Great neighborhood, walking distance to everything. The craftsman details are lovely.' },
    { property: properties[12]._id, user: users[0]._id, rating: 5, comment: 'Silver Lake gem! The rooftop deck with city views is the best part. Modern design perfectly executed.' },
  ];

  await Review.create(reviewsData);
  console.log(`✅ Created ${reviewsData.length} reviews`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Demo credentials:');
  console.log('   Email: demo@propertymind.ai');
  console.log('   Password: Demo@1234');

  await mongoose.disconnect();
};

seedData().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
