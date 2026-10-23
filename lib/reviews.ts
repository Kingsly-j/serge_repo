export type CustomerReview = {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
};

export const starterReviews: CustomerReview[] = [
  {
    id: "michael-anderson",
    name: "Michael Anderson",
    location: "Satisfied Customer",
    rating: 5,
    quote: "I had a great experience purchasing my mobile home. The process was smooth, the team was helpful, and the home was exactly what I was looking for. I would definitely recommend them!",
  },
  {
    id: "jessica-williams",
    name: "Jessica Williams",
    location: "Happy Homeowner",
    rating: 5,
    quote: "Finding an affordable home that met my needs was important to me. I was impressed by the available options and the support I received throughout the process. I love my new home!",
  },
  {
    id: "david-thompson",
    name: "David Thompson",
    location: "Verified Buyer",
    rating: 5,
    quote: "Excellent customer service from start to finish. My questions were answered clearly, and the entire experience gave me confidence in my decision. Great value for the money!",
  },
  {
    id: "amanda-roberts",
    name: "Amanda Roberts",
    location: "Satisfied Customer",
    rating: 5,
    quote: "I was looking for a comfortable and practical home for my family, and I found some wonderful options here. The team made the experience easier than I expected. Highly recommended!",
  },
  {
    id: "robert-johnson",
    name: "Robert Johnson",
    location: "Happy Customer",
    rating: 5,
    quote: "A very positive experience overall. I appreciated the attention to detail, the helpful communication, and the variety of mobile homes available. I would gladly recommend this company to anyone searching for a mobile home.",
  },
];
