// Shared interfaces/types

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
  mainImage: string;
  galleryImages: string[];
  experiences: Experience[];
}