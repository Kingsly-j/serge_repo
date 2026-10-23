export type Room = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
};

export type Collection = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: string;
  sortOrder?: number;
  imageUrl: string;
  rooms: Room[];
};

const champion = "https://s7d9.scene7.com/is/image/championhomes/";

export const starterCollections: Collection[] = [
  {
    id: "utah",
    name: "Utah",
    subtitle: "Regional Homes / Multi-section",
    description: "A spacious manufactured home with room to gather, a connected kitchen and living area, and options to personalize key spaces.",
    price: "$15,000",
    imageUrl: `${champion}Utah%20main%20image`,
    rooms: [
      { id: "utah-living", name: "Living room", description: "An open living and dining area with an easy flow to the kitchen.", imageUrl: `${champion}Utah%20living%20room%20kitchen%20dining%20room` },
      { id: "utah-kitchen", name: "Kitchen", description: "A bright kitchen with an island and room for everyday meals.", imageUrl: `${champion}Utah%20kitchen` },
      { id: "utah-bedroom", name: "Bedroom", description: "A comfortable, light-filled retreat with a practical layout.", imageUrl: `${champion}Utah%20bedroom` },
    ],
  },
  {
    id: "aspire-summit",
    name: "Aspire Summit",
    subtitle: "Dutch Housing / Multi-section",
    description: "A contemporary manufactured home with an inviting living room and customizable kitchen and bath options.",
    price: "$16,500",
    imageUrl: `${champion}112-aspire-2856h32a1c-summit-exterior-2`,
    rooms: [
      { id: "summit-living", name: "Living room", description: "A generous central living space designed for relaxing together.", imageUrl: `${champion}112-aspire-2856h32a1c-summit-living-room-1` },
      { id: "summit-kitchen", name: "Kitchen", description: "A functional kitchen connected to the main living area.", imageUrl: `${champion}112-aspire-2856h32a1c-summit-kitchen-1` },
      { id: "summit-bedroom", name: "Primary bedroom", description: "A quiet bedroom with a comfortable, uncluttered feel.", imageUrl: `${champion}112-aspire-2856h32a1c-summit-primary-bedroom-1` },
    ],
  },
  {
    id: "american-freedom",
    name: "American Freedom 2848PC2",
    subtitle: "Champion Homes / Multi-section",
    description: "A versatile manufactured home with a covered outdoor living area and a layout designed for everyday comfort.",
    price: "$17,500",
    imageUrl: `${champion}AF2848PC-2-exterior`,
    rooms: [
      { id: "freedom-living", name: "Living room", description: "A welcoming main room with flexible space to make your own.", imageUrl: `${champion}AF2848PC-2-living-room-2` },
      { id: "freedom-kitchen", name: "Kitchen", description: "A practical open kitchen with a central island.", imageUrl: `${champion}AF2848PC-2-kitchen-2` },
      { id: "freedom-bedroom", name: "Primary bedroom", description: "A restful space with room for the essentials.", imageUrl: `${champion}AF2848PC-2-master-bed-1` },
    ],
  },
  {
    id: "prime-pinnacle-135",
    name: "Prime Pinnacle 135",
    subtitle: "Champion Homes / Prime Multi-section",
    description: "A spacious five-bedroom home with an open kitchen, generous gathering spaces, and room to make it your own.",
    price: "$20,000",
    imageUrl: `${champion}135-prime-2876H-living-room-1`,
    rooms: [
      { id: "pinnacle-living", name: "Living room", description: "A relaxed central living space with room for everyone.", imageUrl: `${champion}135-prime-2876H-living-room-2` },
      { id: "pinnacle-kitchen", name: "Kitchen", description: "A bright kitchen with generous everyday workspace.", imageUrl: `${champion}135-prime-2876H-kitchen-1` },
      { id: "pinnacle-dining", name: "Dining area", description: "A welcoming spot for family meals and gatherings.", imageUrl: `${champion}135-prime-2876H-dining-1` },
    ],
  },
  {
    id: "prime-2856h42p01",
    name: "Prime 2856H42P01",
    subtitle: "Champion Homes / Prime Multi-section",
    description: "A thoughtfully planned four-bedroom home with an open kitchen and connected living and dining areas.",
    price: "$18,500",
    imageUrl: `${champion}P2856H42P01-Living-Room-1`,
    rooms: [
      { id: "prime2856-living", name: "Living room", description: "A warm shared space with a natural flow to the kitchen.", imageUrl: `${champion}P2856H42P01-Living-Room-2` },
      { id: "prime2856-kitchen", name: "Kitchen", description: "An open kitchen designed to keep daily life connected.", imageUrl: `${champion}Prime-2856H42P01-Kitchen-1` },
      { id: "prime2856-dining", name: "Dining area", description: "A comfortable place to share meals and conversation.", imageUrl: `${champion}Prime-2856H42P01-Dining` },
    ],
  },
];
