
export interface Movie {
  id: string;
  title: string;
  genre: string;
  rating: number;
  posterUrl: string;
  bannerUrl: string;
  duration: string;
  description: string;
  trailerUrl: string;
  status?: 'Now Showing' | 'Coming Soon';
  runtimeDays?: number;
  releaseDate?: string;
  advanceBookingEnabled?: boolean;
}

export interface Showtime {
  id: string;
  time: string;
  theatre: string;
  availableSeats: number;
}

export enum SeatStatus {
  Available = 'available',
  Selected = 'selected',
  Booked = 'booked',
  Premium = 'premium',
}

export interface Seat {
  id:string;
  row: string;
  number: number;
  status: SeatStatus;
  price: number;
}

export interface Snack {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}

export interface CartSnack extends Snack {
  quantity: number;
}

export interface AppContextType {
  city: string;
  setCity: (city: string) => void;
  isDetectingCity: boolean;
  detectCity: () => Promise<{ city?: string; error?: string; }>;
  testLocationDetection: (testCity: string) => Promise<{ city?: string; error?: string; }>;
  selectedMovie: Movie | null;
  setSelectedMovie: (movie: Movie | null) => void;
  selectedShowtime: Showtime | null;
  setSelectedShowtime: (showtime: Showtime | null) => void;
  selectedSeats: Seat[];
  setSelectedSeats: React.Dispatch<React.SetStateAction<Seat[]>>;
  snackCart: CartSnack[];
  setSnackCart: React.Dispatch<React.SetStateAction<CartSnack[]>>;
  addToCart: (snack: Snack) => void;
  removeFromCart: (snackId: string) => void;
  updateQuantity: (snackId: string, quantity: number) => void;
  totalSnackPrice: number;
  totalSeatPrice: number;
}