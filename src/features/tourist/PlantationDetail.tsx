import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, X } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import apiClient from '../../services/apiClient';

function normalizePlantation(raw: any) {
  return {
    id: raw.id,
    name: raw.name,
    address: raw.address,
    mainImage: raw.main_image_url || raw.mainImage || '',
    galleryImages: raw.gallery || raw.galleryImages || [],
    description: raw.description || raw.short_description || '',
    detailedDescription: raw.detailed_description || raw.detailedDescription || raw.description || '',
    features: raw.features || [],
    highlights: {
      altitude: raw.altitude || raw.highlights?.altitude || '',
      area: raw.area || raw.highlights?.area || '',
      visitors: raw.visitors || raw.highlights?.visitors || '',
      established: raw.established_year || raw.highlights?.established || raw.established || '',
    },
    rating: raw.rating || 0,
    reviews: raw.total_reviews || raw.reviews || 0,
    price: raw.price || '',
    duration: raw.duration || '',
    bestTime: raw.best_time_to_visit || raw.bestTime || '',
    contact: {
      phone: raw.phone || raw.contact?.phone || '',
      email: raw.email || raw.contact?.email || '',
    },
    activities: raw.activities || raw.activities || [],
    experiences: (raw.experiences || []).map((exp: any) => ({
      id: exp.id,
      name: exp.name,
      category: exp.category || exp.category || '',
      description: exp.detailed_description || exp.description || '',
      shortDescription: exp.short_description || exp.shortDescription || '',
      announcement: exp.announcement || '',
      priceUSD: {
        adult: exp.price_usd_adult || exp.priceUSD?.adult || 0,
        child: exp.price_usd_child || exp.priceUSD?.child || 0,
      },
      priceLKR: {
        adult: exp.price_lkr_adult || exp.priceLKR?.adult || 0,
        child: exp.price_lkr_child || exp.priceLKR?.child || 0,
      },
      timeSlots: exp.time_slots || exp.timeSlots || [],
      images: exp.images || [],
    })),
  };
}


export const PLANTATION_DATA: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Pedro Tea Estate',
    address: 'Nuwara Eliya, Sri Lanka',
    mainImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbbJISbGQn4noP42c9q4Sha96Z4OKv_kpKeg&s',
    galleryImages: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbbJISbGQn4noP42c9q4Sha96Z4OKv_kpKeg&s',
      'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800',
      'https://images.unsplash.com/photo-1599599810694-b5ac4dd1151c?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    description: 'Experience the charm of Pedro Tea Estate with breathtaking views of tea plantations.',
    detailedDescription: 'Pedro Tea Estate is one of Sri Lanka\'s most prestigious tea plantations, nestled in the misty highlands of Nuwara Eliya. With over 150 years of tea-making excellence, this estate combines traditional methods with modern sustainability practices.',
    features: [
      {
        title: 'Tea Picking Experience',
        description: 'Learn traditional tea picking methods from our expert guides'
      },
      {
        title: 'Factory Tour',
        description: 'Witness the complete tea processing and packaging process'
      },
      {
        title: 'Tea Tasting',
        description: 'Sample premium Ceylon teas with expert-led tasting sessions'
      }
    ],
    highlights: {
      altitude: '2,200m above sea level',
      area: '500 hectares',
      visitors: '10,000+ per year',
      established: '1872'
    },
    rating: 4.8,
    reviews: 245,
    price: '$45 per person',
    duration: '4 hours',
    bestTime: 'December to March',
    contact: {
      phone: '+94 (0) 52 222 2345',
      email: 'info@pedroestate.com'
    },
    activities: [
      'Tea Leaf Picking',
      'Factory Tour',
      'Tea Tasting',
      'Traditional Photography',
      'Picnic Lunch',
      'Hiking'
    ],
    experiences: [
      {
        name: 'Tea Leaf Picking',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 45, child: 25 },
        timeSlots: [
          { date: '2025-02-10', time: '08:00 AM', capacity: 10, booked: 7 },
          { date: '2025-02-10', time: '02:00 PM', capacity: 10, booked: 3 },
          { date: '2025-02-11', time: '08:00 AM', capacity: 10, booked: 2 },
          { date: '2025-02-11', time: '02:00 PM', capacity: 10, booked: 10 },
        ],
      },
      {
        name: 'Factory Tour',
        priceUSD: { adult: 35, child: 18 },
        timeSlots: [
          { date: '2025-02-10', time: '09:00 AM', capacity: 15, booked: 9 },
          { date: '2025-02-10', time: '03:00 PM', capacity: 15, booked: 5 },
          { date: '2025-02-11', time: '09:00 AM', capacity: 15, booked: 15 },
          { date: '2025-02-12', time: '09:00 AM', capacity: 15, booked: 4 },
        ],
      },
      {
        name: 'Tea Tasting',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 25, child: 12 },
        timeSlots: [
          { date: '2025-02-10', time: '11:00 AM', capacity: 20, booked: 12 },
          { date: '2025-02-10', time: '04:00 PM', capacity: 20, booked: 20 },
          { date: '2025-02-11', time: '11:00 AM', capacity: 20, booked: 8 },
        ],
      },
      {
        name: 'Traditional Photography',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 40, child: 22 },
        timeSlots: [
          { date: '2025-02-10', time: '06:30 AM', capacity: 8, booked: 5 },
          { date: '2025-02-11', time: '06:30 AM', capacity: 8, booked: 2 },
          { date: '2025-02-12', time: '06:30 AM', capacity: 8, booked: 1 },
        ],
      },
      {
        name: 'Picnic Lunch',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 30, child: 15 },
        timeSlots: [
          { date: '2025-02-10', time: '12:30 PM', capacity: 12, booked: 10 },
          { date: '2025-02-11', time: '12:30 PM', capacity: 12, booked: 4 },
          { date: '2025-02-12', time: '12:30 PM', capacity: 12, booked: 6 },
        ],
      },
      {
        name: 'Hiking',
        priceUSD: { adult: 50, child: 28 },
        timeSlots: [
          { date: '2025-02-10', time: '07:00 AM', capacity: 12, booked: 11 },
          { date: '2025-02-11', time: '07:00 AM', capacity: 12, booked: 3 },
          { date: '2025-02-12', time: '07:00 AM', capacity: 12, booked: 9 },
        ],
      },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'Sarah Johnson',
        rating: 5,
        date: 'January 15, 2025',
        text: 'Absolutely fantastic experience! The staff was welcoming and knowledgeable. Our guide explained every detail of tea production beautifully. The views were breathtaking!',
        verified: true
      },
      {
        id: 2,
        author: 'Michael Chen',
        rating: 5,
        date: 'January 10, 2025',
        text: 'Best plantation tour I\'ve done in Sri Lanka. The tea tasting was excellent and authentic. The team made us feel very welcome throughout the visit.',
        verified: true
      },
      {
        id: 3,
        author: 'Emma Williams',
        rating: 4,
        date: 'January 5, 2025',
        text: 'Great experience overall. The factory tour was impressive. Only minor issue was the tour duration was shorter than expected, but still worth visiting!',
        verified: true
      }
    ]
  },
  '2': {
    id: '2',
    name: 'Bluefield Tea Garden',
    address: 'Ramboda, Sri Lanka',
    mainImage: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800',
    galleryImages: ['https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800', 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5d1?w=800', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1495195134817-aeb325ef3c61?w=800'],
    description: 'Discover the tranquility and beauty of Bluefield Tea Garden.',
    detailedDescription: 'Bluefield Tea Garden offers a serene experience amidst lush green landscapes and cascading waterfalls. This family-owned estate is known for its exceptional quality teas and warm hospitality.',
    features: [
      { title: 'Waterfall Trekking', description: 'Explore scenic trails with beautiful waterfall views' },
      { title: 'Tea Blending Workshop', description: 'Create your own custom tea blend' },
      { title: 'Farm Fresh Meals', description: 'Enjoy organic meals prepared with estate-grown ingredients' }
    ],
    highlights: {
      altitude: '1,800m above sea level',
      area: '300 hectares',
      visitors: '8,000+ per year',
      established: '1920'
    },
    rating: 4.7,
    reviews: 198,
    price: '$40 per person',
    duration: '3.5 hours',
    bestTime: 'January to April',
    contact: {
      phone: '+94 (0) 52 234 5678',
      email: 'info@bluefieldgarden.com'
    },
    activities: ['Waterfall Trek', 'Tea Blending', 'Cooking Class', 'Photography', 'Nature Walk'],
    experiences: [
      {
        name: 'Waterfall Trek',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 40, child: 22 },
        timeSlots: [
          { date: '2025-02-10', time: '07:00 AM', capacity: 12, booked: 8 },
          { date: '2025-02-10', time: '02:00 PM', capacity: 12, booked: 10 },
          { date: '2025-02-11', time: '07:00 AM', capacity: 12, booked: 5 },
        ],
      },
      {
        name: 'Tea Blending',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 35, child: 18 },
        timeSlots: [
          { date: '2025-02-10', time: '10:00 AM', capacity: 10, booked: 10 },
          { date: '2025-02-10', time: '03:00 PM', capacity: 10, booked: 2 },
          { date: '2025-02-11', time: '10:00 AM', capacity: 10, booked: 6 },
        ],
      },
      {
        name: 'Cooking Class',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 50, child: 28 },
        timeSlots: [
          { date: '2025-02-10', time: '11:00 AM', capacity: 8, booked: 7 },
          { date: '2025-02-11', time: '11:00 AM', capacity: 8, booked: 3 },
          { date: '2025-02-12', time: '11:00 AM', capacity: 8, booked: 1 },
        ],
      },
      {
        name: 'Photography',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 30, child: 15 },
        timeSlots: [
          { date: '2025-02-10', time: '06:00 AM', capacity: 10, booked: 9 },
          { date: '2025-02-11', time: '06:00 AM', capacity: 10, booked: 2 },
          { date: '2025-02-12', time: '06:00 AM', capacity: 10, booked: 5 },
        ],
      },
      {
        name: 'Nature Walk',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 25, child: 12 },
        timeSlots: [
          { date: '2025-02-10', time: '04:00 PM', capacity: 15, booked: 14 },
          { date: '2025-02-11', time: '04:00 PM', capacity: 15, booked: 6 },
          { date: '2025-02-12', time: '04:00 PM', capacity: 15, booked: 8 },
        ],
      },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'James Rodriguez',
        rating: 5,
        date: 'January 12, 2025',
        text: 'The waterfall trek was spectacular! The tea blending workshop was the highlight. Highly recommended for nature lovers.',
        verified: true
      },
      {
        id: 2,
        author: 'Lisa Anderson',
        rating: 4,
        date: 'January 8, 2025',
        text: 'Beautiful location with wonderful hospitality. The farm-fresh meals were delicious and authentic.',
        verified: true
      }
    ]
  },
  '3': {
    id: '3',
    name: 'Haputale Estate',
    address: 'Haputale, Sri Lanka',
    mainImage: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5d1?w=800',
    galleryImages: ['https://images.unsplash.com/photo-1511537190424-bbbab87ac5d1?w=800', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1495195134817-aeb325ef3c61?w=800', 'https://images.unsplash.com/photo-1599599810694-b5ac4dd1151c?w=800'],
    description: 'Explore the historic Haputale Estate with stunning mountain views.',
    detailedDescription: 'Haputale Estate is renowned for its panoramic views and historic significance in Ceylon tea production. The estate offers authentic experiences and educational tours.',
    features: [
      { title: 'Panoramic Views', description: 'Stunning vistas of surrounding tea plantations' },
      { title: 'Heritage Tour', description: 'Learn about the estate\'s 150+ year history' },
      { title: 'Local Cuisine', description: 'Authentic Sri Lankan meals' }
    ],
    highlights: {
      altitude: '1,900m above sea level',
      area: '450 hectares',
      visitors: '7,500+ per year',
      established: '1889'
    },
    rating: 4.6,
    reviews: 176,
    price: '$38 per person',
    duration: '4 hours',
    bestTime: 'February to May',
    contact: {
      phone: '+94 (0) 52 245 6789',
      email: 'info@haputale-estate.com'
    },
    activities: ['Heritage Tour', 'Tea Processing', 'Bird Watching', 'Sunset Viewing', 'Cultural Show'],
    experiences: [
      {
        name: 'Heritage Tour',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 38, child: 20 },
        timeSlots: [
          { date: '2025-02-10', time: '09:00 AM', capacity: 15, booked: 9 },
          { date: '2025-02-10', time: '02:00 PM', capacity: 15, booked: 12 },
          { date: '2025-02-11', time: '09:00 AM', capacity: 15, booked: 4 },
        ],
      },
      {
        name: 'Tea Processing',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 35, child: 18 },
        timeSlots: [
          { date: '2025-02-10', time: '08:30 AM', capacity: 12, booked: 10 },
          { date: '2025-02-11', time: '08:30 AM', capacity: 12, booked: 5 },
          { date: '2025-02-12', time: '08:30 AM', capacity: 12, booked: 2 },
        ],
      },
      {
        name: 'Bird Watching',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 30, child: 15 },
        timeSlots: [
          { date: '2025-02-10', time: '06:00 AM', capacity: 10, booked: 10 },
          { date: '2025-02-11', time: '06:00 AM', capacity: 10, booked: 3 },
          { date: '2025-02-12', time: '06:00 AM', capacity: 10, booked: 7 },
        ],
      },
      {
        name: 'Sunset Viewing',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 25, child: 12 },
        timeSlots: [
          { date: '2025-02-10', time: '05:00 PM', capacity: 20, booked: 15 },
          { date: '2025-02-11', time: '05:00 PM', capacity: 20, booked: 8 },
          { date: '2025-02-12', time: '05:00 PM', capacity: 20, booked: 11 },
        ],
      },
      {
        name: 'Cultural Show',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 40, child: 22 },
        timeSlots: [
          { date: '2025-02-10', time: '07:00 PM', capacity: 25, booked: 18 },
          { date: '2025-02-11', time: '07:00 PM', capacity: 25, booked: 9 },
          { date: '2025-02-12', time: '07:00 PM', capacity: 25, booked: 3 },
        ],
      },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'David Thompson',
        rating: 5,
        date: 'January 11, 2025',
        text: 'Absolutely breathtaking views from the estate. The heritage tour was very informative. A must-visit!',
        verified: true
      }
    ]
  },
  '4': {
    id: '4',
    name: 'Uda Pussellawa',
    address: 'Kandy, Sri Lanka',
    mainImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    galleryImages: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1495195134817-aeb325ef3c61?w=800', 'https://images.unsplash.com/photo-1599599810694-b5ac4dd1151c?w=800', 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800'],
    description: 'Visit the lush green plantations of Uda Pussellawa.',
    detailedDescription: 'Uda Pussellawa is a premier tea estate offering immersive tea tourism experiences in the heart of Kandy\'s tea country.',
    features: [
      { title: 'Tea Picking', description: 'Hand-pick tea leaves with local farmers' },
      { title: 'Processing Facility', description: 'Modern tea processing technology tour' },
      { title: 'Accommodation', description: 'Stay overnight in estate cottages' }
    ],
    highlights: {
      altitude: '1,700m above sea level',
      area: '380 hectares',
      visitors: '6,000+ per year',
      established: '1895'
    },
    rating: 4.5,
    reviews: 152,
    price: '$42 per person',
    duration: '5 hours',
    bestTime: 'March to June',
    contact: {
      phone: '+94 (0) 81 234 5678',
      email: 'info@udapussellawa.com'
    },
    activities: ['Tea Picking', 'Factory Tour', 'Overnight Stay', 'Traditional Cooking', 'Meditation'],
    experiences: [
      {
        name: 'Tea Picking',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 42, child: 23 },
        timeSlots: [
          { date: '2025-02-10', time: '08:00 AM', capacity: 12, booked: 8 },
          { date: '2025-02-10', time: '02:00 PM', capacity: 12, booked: 11 },
          { date: '2025-02-11', time: '08:00 AM', capacity: 12, booked: 4 },
        ],
      },
      {
        name: 'Factory Tour',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 35, child: 18 },
        timeSlots: [
          { date: '2025-02-10', time: '10:00 AM', capacity: 15, booked: 12 },
          { date: '2025-02-11', time: '10:00 AM', capacity: 15, booked: 6 },
          { date: '2025-02-12', time: '10:00 AM', capacity: 15, booked: 2 },
        ],
      },
      {
        name: 'Overnight Stay',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 80, child: 45 },
        timeSlots: [
          { date: '2025-02-10', time: '06:00 PM', capacity: 6, booked: 6 },
          { date: '2025-02-11', time: '06:00 PM', capacity: 6, booked: 2 },
          { date: '2025-02-12', time: '06:00 PM', capacity: 6, booked: 4 },
        ],
      },
      {
        name: 'Traditional Cooking',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 45, child: 25 },
        timeSlots: [
          { date: '2025-02-10', time: '11:00 AM', capacity: 10, booked: 9 },
          { date: '2025-02-11', time: '11:00 AM', capacity: 10, booked: 5 },
          { date: '2025-02-12', time: '11:00 AM', capacity: 10, booked: 1 },
        ],
      },
      {
        name: 'Meditation',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 20, child: 10 },
        timeSlots: [
          { date: '2025-02-10', time: '06:00 AM', capacity: 20, booked: 15 },
          { date: '2025-02-11', time: '06:00 AM', capacity: 20, booked: 8 },
          { date: '2025-02-12', time: '06:00 AM', capacity: 20, booked: 12 },
        ],
      },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'Robert Davis',
        rating: 4,
        date: 'January 9, 2025',
        text: 'Great tea picking experience! The guides were very knowledgeable. Would recommend for anyone interested in authentic tea farming.',
        verified: true
      }
    ]
  },
  '5': {
    id: '5',
    name: 'Dambulla Tea Valley',
    address: 'Dambulla, Sri Lanka',
    mainImage: 'https://images.unsplash.com/photo-1495195134817-aeb325ef3c61?w=800',
    galleryImages: ['https://images.unsplash.com/photo-1495195134817-aeb325ef3c61?w=800', 'https://images.unsplash.com/photo-1599599810694-b5ac4dd1151c?w=800', 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800', 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5d1?w=800'],
    description: 'Immerse yourself in the scenic Dambulla Tea Valley with traditional tea-making experiences.',
    detailedDescription: 'Dambulla Tea Valley offers unique cultural experiences combined with traditional tea-making practices.',
    features: [
      { title: 'Traditional Methods', description: 'Learn ancestral tea-making techniques' },
      { title: 'Cultural Show', description: 'Experience local music and dance' },
      { title: 'Market Visit', description: 'Browse local markets and crafts' }
    ],
    highlights: {
      altitude: '1,500m above sea level',
      area: '320 hectares',
      visitors: '5,500+ per year',
      established: '1910'
    },
    rating: 4.4,
    reviews: 128,
    price: '$35 per person',
    duration: '4 hours',
    bestTime: 'April to September',
    contact: {
      phone: '+94 (0) 66 234 5678',
      email: 'info@dambullateavalley.com'
    },
    activities: ['Traditional Tea Making', 'Cultural Show', 'Market Tour', 'Meditation', 'Photography'],
    experiences: [
      {
        name: 'Traditional Tea Making',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 35, child: 18 },
        timeSlots: [
          { date: '2025-02-10', time: '08:00 AM', capacity: 10, booked: 7 },
          { date: '2025-02-10', time: '03:00 PM', capacity: 10, booked: 9 },
          { date: '2025-02-11', time: '08:00 AM', capacity: 10, booked: 2 },
        ],
      },
      {
        name: 'Cultural Show',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 30, child: 15 },
        timeSlots: [
          { date: '2025-02-10', time: '07:00 PM', capacity: 20, booked: 16 },
          { date: '2025-02-11', time: '07:00 PM', capacity: 20, booked: 5 },
          { date: '2025-02-12', time: '07:00 PM', capacity: 20, booked: 11 },
        ],
      },
      {
        name: 'Market Tour',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 25, child: 12 },
        timeSlots: [
          { date: '2025-02-10', time: '09:00 AM', capacity: 15, booked: 12 },
          { date: '2025-02-11', time: '09:00 AM', capacity: 15, booked: 4 },
          { date: '2025-02-12', time: '09:00 AM', capacity: 15, booked: 8 },
        ],
      },
      {
        name: 'Meditation',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 20, child: 10 },
        timeSlots: [
          { date: '2025-02-10', time: '06:00 AM', capacity: 15, booked: 14 },
          { date: '2025-02-11', time: '06:00 AM', capacity: 15, booked: 3 },
          { date: '2025-02-12', time: '06:00 AM', capacity: 15, booked: 9 },
        ],
      },
      {
        name: 'Photography',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 30, child: 15 },
        timeSlots: [
          { date: '2025-02-10', time: '05:30 AM', capacity: 10, booked: 8 },
          { date: '2025-02-11', time: '05:30 AM', capacity: 10, booked: 2 },
          { date: '2025-02-12', time: '05:30 AM', capacity: 10, booked: 6 },
        ],
      },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'Patricia Miller',
        rating: 5,
        date: 'January 7, 2025',
        text: 'Cultural experience was amazing! The traditional tea-making demonstration was enlightening. Very authentic!',
        verified: true
      }
    ]
  },
  '6': {
    id: '6',
    name: 'Ella Ridge Plantation',
    address: 'Ella, Sri Lanka',
    mainImage: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd1151c?w=800',
    galleryImages: ['https://images.unsplash.com/photo-1599599810694-b5ac4dd1151c?w=800', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1495195134817-aeb325ef3c61?w=800', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbbJISbGQn4noP42c9q4Sha96Z4OKv_kpKeg&s'],
    description: 'Enjoy panoramic views and authentic Ceylon tea at Ella Ridge Plantation.',
    detailedDescription: 'Ella Ridge Plantation combines adventure and relaxation with breathtaking vistas and premium tea experiences.',
    features: [
      { title: 'Panoramic Hikes', description: 'Guided hikes with stunning ridge views' },
      { title: 'Tea Spa', description: 'Relaxing treatments with tea extracts' },
      { title: 'Gourmet Dining', description: 'Tea-paired meals with mountain views' }
    ],
    highlights: {
      altitude: '2,050m above sea level',
      area: '420 hectares',
      visitors: '9,000+ per year',
      established: '1901'
    },
    rating: 4.9,
    reviews: 267,
    price: '$50 per person',
    duration: '5 hours',
    bestTime: 'November to April',
    contact: {
      phone: '+94 (0) 57 234 5678',
      email: 'info@ellaridge.com'
    },
    activities: ['Hiking', 'Tea Spa', 'Gourmet Dining', 'Tea Tasting', 'Photography Tours'],
    experiences: [
      {
        name: 'Hiking',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 50, child: 28 },
        timeSlots: [
          { date: '2025-02-10', time: '07:00 AM', capacity: 12, booked: 10 },
          { date: '2025-02-10', time: '02:00 PM', capacity: 12, booked: 8 },
          { date: '2025-02-11', time: '07:00 AM', capacity: 12, booked: 3 },
        ],
      },
      {
        name: 'Tea Spa',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 60, child: 33 },
        timeSlots: [
          { date: '2025-02-10', time: '10:00 AM', capacity: 8, booked: 8 },
          { date: '2025-02-11', time: '10:00 AM', capacity: 8, booked: 4 },
          { date: '2025-02-12', time: '10:00 AM', capacity: 8, booked: 1 },
        ],
      },
      {
        name: 'Gourmet Dining',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 55, child: 30 },
        timeSlots: [
          { date: '2025-02-10', time: '12:00 PM', capacity: 10, booked: 9 },
          { date: '2025-02-11', time: '12:00 PM', capacity: 10, booked: 5 },
          { date: '2025-02-12', time: '12:00 PM', capacity: 10, booked: 2 },
        ],
      },
      {
        name: 'Tea Tasting',
        category: 'Tea Factory Tour & Tasting',
        priceUSD: { adult: 30, child: 15 },
        timeSlots: [
          { date: '2025-02-10', time: '03:00 PM', capacity: 15, booked: 12 },
          { date: '2025-02-11', time: '03:00 PM', capacity: 15, booked: 6 },
          { date: '2025-02-12', time: '03:00 PM', capacity: 15, booked: 9 },
        ],
      },
      {
        name: 'Photography Tours',
        category: 'Hiking & Tea Plucking',
        priceUSD: { adult: 45, child: 25 },
        timeSlots: [
          { date: '2025-02-10', time: '06:30 AM', capacity: 10, booked: 9 },
          { date: '2025-02-11', time: '06:30 AM', capacity: 10, booked: 3 },
          { date: '2025-02-12', time: '06:30 AM', capacity: 10, booked: 7 },
        ],
      },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'Jennifer White',
        rating: 5,
        date: 'January 14, 2025',
        text: 'Outstanding views and exceptional service! The gourmet tea-paired meals were exquisite. Highly recommended!',
        verified: true
      },
      {
        id: 2,
        author: 'Christopher Brown',
        rating: 5,
        date: 'January 6, 2025',
        text: 'The tea spa was incredibly relaxing. The hikes offer some of the best views in Sri Lanka. Worth every penny!',
        verified: true
      }
    ]
  }
};


try {
  const storedPlantations = JSON.parse(localStorage.getItem('plantations') || '{}');
  Object.keys(storedPlantations).forEach((pid) => {
    if (PLANTATION_DATA[pid]) {
      PLANTATION_DATA[pid] = { ...PLANTATION_DATA[pid], ...storedPlantations[pid] };
    } else {
      PLANTATION_DATA[pid] = storedPlantations[pid];
    }
  });
} catch (e) {
  // ignore parse errors
}

export default function PlantationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [plantation, setPlantation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setPlantation(null);
      return;
    }

    const fetchPlantation = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const response = await apiClient.get(`/plantations/${id}`);
        setPlantation(normalizePlantation(response.data?.data));
      } catch (error) {
        console.error('Failed to load plantation details:', error);
        if (PLANTATION_DATA[id]) {
          setPlantation(PLANTATION_DATA[id]);
        } else {
          setPlantation(null);
          setLoadError('Unable to load plantation details.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPlantation();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-sans text-[#1B4332]">
        <Navbar />
        <main className="py-16 px-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Loading plantation details...</h1>
          <p className="text-gray-600">Please wait while we fetch the latest plantation information.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!plantation) {
    return (
      <div className="min-h-screen bg-white font-sans text-[#1B4332]">
        <Navbar />
        <main className="py-16 px-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Plantation not found</h1>
          {loadError ? <p className="text-red-600 mb-6">{loadError}</p> : null}
          <button
            onClick={() => navigate('/plantations')}
            className="bg-[#2D6A4F] text-white px-6 py-3 rounded-lg hover:bg-[#1B4332] transition"
          >
            Back to Plantations
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-black p-2 rounded-full hover:bg-gray-200 transition z-10"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Full view"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <Navbar />

      {/* Main Image */}
      <div className="relative h-96 w-full overflow-hidden">
        <img
          src={plantation.mainImage}
          alt={plantation.name}
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/20"></div>
      </div>

      {/* Main Content */}
      <main className="py-16 px-12">
        <div className="max-w-5xl mx-auto">
          {/* Title and Location */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-serif mb-4">{plantation.name}</h1>
            <div className="flex items-center gap-2 text-lg text-gray-600 mb-6">
              <MapPin size={24} />
              <span>{plantation.address}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">{plantation.detailedDescription}</p>
          </div>

          {/* Gallery - 3 Images in a Row */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Photo Gallery</h2>
            <div className="grid grid-cols-3 gap-6">
              {plantation.galleryImages.slice(0, 3).map((image: string, idx: number) => (
                <img
                  key={idx}
                  src={image}
                  alt={`Gallery ${idx + 1}`}
                  onClick={() => setSelectedImage(image)}
                  className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition cursor-pointer hover:opacity-80"
                />
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Experience Highlights</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plantation.features.map((feature: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition border-l-4 border-[#2D6A4F]">
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights Info */}
          <div className="mb-16 bg-gradient-to-r from-[#2D6A4F] to-[#52B788] text-white p-8 rounded-lg">
            <h2 className="text-3xl font-bold mb-8">Estate Information</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm opacity-90">Altitude</p>
                <p className="text-2xl font-bold">{plantation.highlights.altitude}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Area</p>
                <p className="text-2xl font-bold">{plantation.highlights.area}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Annual Visitors</p>
                <p className="text-2xl font-bold">{plantation.highlights.visitors}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Established</p>
                <p className="text-2xl font-bold">{plantation.highlights.established}</p>
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Available Activities</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {plantation.activities.map((activity: string, idx: number) => (
                <div key={idx} className="bg-[#B7E4C7] text-[#1B4332] px-6 py-3 rounded-full text-center font-semibold">
                  {activity}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate(`/plantation/${id}/booking`)}
                className="bg-[#52B788] hover:bg-[#40916c] text-white font-bold py-3 px-12 rounded-lg transition text-lg"
              >
                Book Experience
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mb-16 bg-gray-50 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Best Time to Visit</h2>
            <p className="text-2xl font-semibold text-[#2D6A4F]">{plantation.bestTime}</p>
          </div>

          {/* Rating and Reviews */}
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Visitor Reviews</h2>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(plantation.rating) ? 'text-yellow-400 text-3xl' : 'text-gray-300 text-3xl'}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-3xl font-bold">{plantation.rating}</span>
            </div>
            <p className="text-lg text-gray-600 mb-8">Based on {plantation.reviews} visitor reviews</p>

            {/* Individual Reviews */}
            <div className="space-y-6 max-w-3xl mx-auto mb-8">
              {plantation.reviewsList.slice(0, 2).map((review: any) => (
                <div key={review.id} className="bg-gray-50 p-6 rounded-lg text-left border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{review.author}</h3>
                      <p className="text-sm text-gray-500">{review.date}</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700">{review.text}</p>
                  {review.verified && (
                    <p className="text-xs text-green-600 mt-3">✓ Verified Guest</p>
                  )}
                </div>
              ))}
            </div>

            {/* More Reviews Button */}
            <button
              onClick={() => navigate(`/plantation/${id}/reviews`)}
              className="text-[#2D6A4F] hover:text-[#1B4332] font-semibold text-lg underline"
            >
              View All {plantation.reviews} Reviews →
            </button>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-[#52B788] to-[#40916c] text-white p-8 rounded-lg mb-16">
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm opacity-90">Telephone</p>
                  <p className="text-lg font-semibold">{plantation.contact.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm opacity-90">Email</p>
                  <p className="text-lg font-semibold">{plantation.contact.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/plantations')}
              className="text-[#2D6A4F] hover:text-[#1B4332] font-semibold text-lg underline"
            >
              ← Back to All Plantations
            </button>
          </div>
        </div>
      </main>

     
      <Footer />
    </div>
  );
}
