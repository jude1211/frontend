declare module 'react-seat-picker' {
  import * as React from 'react';

  export interface Seat {
    id: string;
    number: number | string;
    tooltip?: string;
    isReserved?: boolean;
    isVIP?: boolean;
  }

  export interface SeatPickerProps {
    rows: Array<Array<Seat | null>>;
    alpha?: boolean;
    maxReservableSeats?: number;
    addSeatCallback?: (payload: { row: number; number: number; id: string }, addCb: (row: number, number: number, id?: string) => void) => void;
    removeSeatCallback?: (payload: { row: number; number: number; id: string }, removeCb: (row: number, number: number) => void) => void;
    visible?: boolean;
    continuous?: boolean;
  }

  const SeatPicker: React.ComponentType<SeatPickerProps>;
  export default SeatPicker;
}

