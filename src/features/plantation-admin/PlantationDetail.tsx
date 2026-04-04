// This file is often used for mock data and shared interfaces.

export interface TimeSlot {
  date: string;
  time: string;
  capacity: number;
  booked: number;
}

export interface PriceDetails {
  adult: number;
  child: number;
}

export interface Experience {
  name: string;
  category: string;
  priceLKR: PriceDetails; 
  priceUSD: PriceDetails; 
  timeSlots: TimeSlot[];
}

export interface Plantation {
  id: string;
  name: string;
  address: string;
  description: string;
  detailedDescription: string;
  bestTime: string;
  contact: {
    phone: string;
    email: string;
  };
  highlights: {
    altitude: string;
    area: string;
    visitors: string;
    established: string;
  };
  mainImage: string; // Add if not present
  galleryImages: string[]; // Add if not present
  experiences: Experience[]; 
}

export const PLANTATION_DATA: Record<string, Plantation> = {
  '1': {
    id: '1',
    name: 'Pedro Tea Estate',
    address: 'Nuwara Eliya, Sri Lanka',
    description: 'One of the oldest and most renowned tea factories in Sri Lanka, offering insights into the tea making process.',
    detailedDescription: 'Nestled amidst the lush green hills of Nuwara Eliya, Pedro Tea Estate offers a captivating journey into the world of Ceylon tea. Established in 1885, it is one of the oldest tea factories in Sri Lanka, maintaining traditional methods of tea production. Visitors can witness the intricate process from leaf plucking to the final brew, followed by a delightful tea tasting session. The estate provides a serene escape, showcasing breathtaking views and the rich heritage of Sri Lankan tea.',
    bestTime: 'February to May and August to September (dry season)',
    contact: {
      phone: '+94 52 222 2222',
      email: 'info@pedrotea.com',
    },
    highlights: {
      altitude: 'Around 1,800m (6,000 ft)',
      area: 'Over 100 hectares',
      visitors: '50,000+ annually',
      established: '1885',
    },
    mainImage: 'https://via.placeholder.com/1200x600?text=Pedro+Tea+Estate+Main', // Placeholder
    galleryImages: [
      'https://via.placeholder.com/400x300?text=Pedro+Gallery+1',
      'https://via.placeholder.com/400x300?text=Pedro+Gallery+2',
      'https://via.placeholder.com/400x300?text=Pedro+Gallery+3',
      'https://via.placeholder.com/400x300?text=Pedro+Gallery+4',
    ],
    experiences: [
      {
        name: 'Tea Factory Tour & Tasting',
        category: 'Tea Factory Tour & Tasting',
        priceLKR: { adult: 1500, child: 750 },
        priceUSD: { adult: 10, child: 5 },
        timeSlots: [
          { date: '2025-01-10', time: '10:00 AM', capacity: 20, booked: 5 },
          { date: '2025-01-10', time: '02:00 PM', capacity: 20, booked: 12 },
          { date: '2025-01-11', time: '10:00 AM', capacity: 20, booked: 8 },
        ],
      },
      {
        name: 'Tea Leaf Picking Experience',
        category: 'Hiking & Tea Plucking',
        priceLKR: { adult: 2500, child: 1250 },
        priceUSD: { adult: 15, child: 8 },
        timeSlots: [
          { date: '2025-01-10', time: '09:00 AM', capacity: 10, booked: 3 },
          { date: '2025-01-11', time: '01:00 PM', capacity: 10, booked: 7 },
        ],
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Bluefield Tea Garden',
    address: 'Ramboda, Sri Lanka',
    description: 'A beautiful tea garden with stunning waterfalls and a factory that offers engaging tours.',
    detailedDescription: 'Bluefield Tea Garden, located in the picturesque Ramboda region, is renowned for its lush tea plantations and the majestic Ramboda Falls. Visitors can enjoy a comprehensive tea factory tour, learning about the tea-making process from expert guides. The estate also boasts a well-maintained garden, a restaurant, and a shop offering a variety of Ceylon tea products. It\'s a perfect stop for nature lovers and tea enthusiasts alike.',
    bestTime: 'December to April',
    contact: {
      phone: '+94 62 222 3333',
      email: 'contact@bluefieldtea.com',
    },
    highlights: {
      altitude: 'Around 1,200m (4,000 ft)',
      area: 'Over 80 hectares',
      visitors: '30,000+ annually',
      established: '1900',
    },
    mainImage: 'https://via.placeholder.com/1200x600?text=Bluefield+Tea+Garden+Main', // Placeholder
    galleryImages: [
      'https://via.placeholder.com/400x300?text=Bluefield+Gallery+1',
      'https://via.placeholder.com/400x300?text=Bluefield+Gallery+2',
    ],
    experiences: [
      {
        name: 'Tea Factory Tour & Waterfall Visit',
        category: 'Tea Factory Tour & Tasting',
        priceLKR: { adult: 1800, child: 900 },
        priceUSD: { adult: 12, child: 6 },
        timeSlots: [
          { date: '2025-01-15', time: '10:30 AM', capacity: 25, booked: 10 },
          { date: '2025-01-16', time: '01:30 PM', capacity: 25, booked: 15 },
        ],
      },
      {
        name: 'Nature Walk & Tea Tasting',
        category: 'Hiking & Tea Plucking',
        priceLKR: { adult: 2000, child: 1000 },
        priceUSD: { adult: 13, child: 7 },
        timeSlots: [
          { date: '2025-01-15', time: '09:00 AM', capacity: 15, booked: 5 },
        ],
      },
    ],
  },

};