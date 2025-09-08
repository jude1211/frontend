
import { Movie, Showtime, Snack } from './types';

export const POPULAR_CITIES = ['Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chandigarh', 'Chennai', 'Pune', 'Kolkata', 'Kochi'];

export const MOVIES: Movie[] = [
  {
    id: '1',
    title: 'F1: The Movie',
    genre: 'Action/Drama/Sports',
    rating: 8.5,
    posterUrl: 'https://picsum.photos/seed/f1movie/400/600',
    bannerUrl: 'https://picsum.photos/seed/f1banner/1200/400',
    duration: '2h 15m',
    description: 'A thrilling ride into the high-stakes world of Formula 1 racing, focusing on the rivalry between two competing teams.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '2',
    title: 'Saiyara',
    genre: 'Drama/Musical/Romantic',
    rating: 9.1,
    posterUrl: 'https://picsum.photos/seed/saiyara/400/600',
    bannerUrl: 'https://picsum.photos/seed/saiyarabanner/1200/400',
    duration: '2h 45m',
    description: 'A beautiful musical journey of love, loss, and redemption set against the backdrop of vibrant Indian landscapes.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '3',
    title: 'Metro... In Dino',
    genre: 'Drama/Romantic',
    rating: 7.8,
    posterUrl: 'https://picsum.photos/seed/metro/400/600',
    bannerUrl: 'https://picsum.photos/seed/metrobanner/1200/400',
    duration: '2h 5m',
    description: 'An anthology of stories about love and relationships in a bustling metropolis.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '4',
    title: 'Superman',
    genre: 'Action/Adventure/Fantasy',
    rating: 8.8,
    posterUrl: 'https://picsum.photos/seed/superman/400/600',
    bannerUrl: 'https://picsum.photos/seed/supermanbanner/1200/400',
    duration: '2h 30m',
    description: 'The classic story of the Man of Steel, who must balance his life as a hero with his love for Lois Lane.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '5',
    title: 'Maa',
    genre: 'Fantasy/Horror/Mythological',
    rating: 7.2,
    posterUrl: 'https://picsum.photos/seed/maa/400/600',
    bannerUrl: 'https://picsum.photos/seed/maabanner/1200/400',
    duration: '2h 10m',
    description: 'A terrifying tale rooted in mythology, where a mother\'s love is tested against supernatural forces.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
];

export const SHOWTIMES: Showtime[] = [
  { id: 'st1', time: '10:00 AM', theatre: 'PVR Cinemas, Grand Mall', availableSeats: 50 },
  { id: 'st2', time: '01:30 PM', theatre: 'INOX, City Center', availableSeats: 30 },
  { id: 'st3', time: '04:00 PM', theatre: 'Cinepolis, Metroplex', availableSeats: 80 },
  { id: 'st4', time: '07:15 PM', theatre: 'PVR Cinemas, Grand Mall', availableSeats: 15 },
  { id: 'st5', time: '10:30 PM', theatre: 'INOX, City Center', availableSeats: 60 },
];

export const SNACKS: Snack[] = [
  { id: 'sn1', name: 'Salted Popcorn', price: 5, imageUrl: 'https://picsum.photos/seed/popcorn/200/200', description: 'Classic salted popcorn, freshly made.' },
  { id: 'sn2', name: 'Caramel Popcorn', price: 6, imageUrl: 'https://picsum.photos/seed/caramelpopcorn/200/200', description: 'Sweet and crunchy caramel-coated popcorn.' },
  { id: 'sn3', name: 'Nachos with Cheese', price: 7, imageUrl: 'https://picsum.photos/seed/nachos/200/200', description: 'Crispy nachos served with warm cheese dip.' },
  { id: 'sn4', name: 'Soft Drink', price: 3, imageUrl: 'https://picsum.photos/seed/soda/200/200', description: 'Your choice of a refreshing cold drink.' },
  { id: 'sn5', name: 'Hot Dog', price: 6, imageUrl: 'https://picsum.photos/seed/hotdog/200/200', description: 'A classic cinema hot dog with your choice of sauce.' },
  { id: 'sn6', name: 'Candy Bar', price: 2, imageUrl: 'https://picsum.photos/seed/candy/200/200', description: 'A variety of popular chocolate bars.' },
];
