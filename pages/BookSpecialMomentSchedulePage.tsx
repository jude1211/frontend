import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

interface Screen {
    screenId: string;
    screenName: string;
}

const BookSpecialMomentSchedulePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theatre, selectedImage, personName, personPhoto, selectedFont } = location.state || {};

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedScreen, setSelectedScreen] = useState<string>('');
    const [screens, setScreens] = useState<Screen[]>([]);
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [selectedTime, setSelectedTime] = useState({
        hour: '12',
        minute: '00',
        period: 'PM'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (theatre?._id) {
                try {
                    const [screensResponse, datesResponse] = await Promise.all([
                        apiService.getPublicTheatreScreens(theatre._id),
                        apiService.getPublicTheatreDates(theatre._id)
                    ]);

                    if (screensResponse.success && screensResponse.data) {
                        setScreens(screensResponse.data);
                        if (screensResponse.data.length > 0) {
                            setSelectedScreen(screensResponse.data[0].screenName);
                        }
                    }

                    if (datesResponse.success && datesResponse.data) {
                        // Convert string dates to Date objects and filter out past dates
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const dateObjects = datesResponse.data
                            .map((d: string) => new Date(d))
                            .filter((date: Date) => {
                                const checkDate = new Date(date);
                                checkDate.setHours(0, 0, 0, 0);
                                return checkDate.getTime() >= today.getTime();
                            });

                        setAvailableDates(dateObjects);
                        if (dateObjects.length > 0) {
                            setSelectedDate(dateObjects[0]);
                        }
                    } else {
                        // Fallback to next 7 days if no dates found (or handle empty state)
                        const dates = Array.from({ length: 7 }, (_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() + i);
                            return date;
                        });
                        setAvailableDates(dates);
                    }

                } catch (error) {
                    console.error('Failed to fetch data:', error);
                    // Fallback generating dates on error
                    const dates = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        return date;
                    });
                    setAvailableDates(dates);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchData();
    }, [theatre]);

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];
    const periods = ['AM', 'PM'];

    const handleProceed = () => {
        // Validation for past time on same date
        const now = new Date();
        const isToday =
            selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear();

        if (isToday) {
            let hour = parseInt(selectedTime.hour);
            if (selectedTime.period === 'PM' && hour !== 12) hour += 12;
            if (selectedTime.period === 'AM' && hour === 12) hour = 0;

            const selectedDateTime = new Date(selectedDate);
            selectedDateTime.setHours(hour, parseInt(selectedTime.minute), 0, 0);

            if (selectedDateTime < now) {
                alert("The selected time has already passed. Please select a valid future time.");
                return;
            }
        }

        // Handle booking confirmation navigation here
        console.log('Booking details:', {
            theatre,
            date: selectedDate,
            screen: selectedScreen,
            time: selectedTime,
            image: selectedImage,
            personName,
            personPhoto,
            font: selectedFont
        });
        // navigate('/booking-confirmation', { ... });
    };

    if (!theatre) {
        return (
            <div className="min-h-screen bg-brand-bg text-white flex items-center justify-center">
                <p>No theatre selected. Please go back and select a theatre.</p>
                <button
                    onClick={() => navigate('/book-special-moment')}
                    className="ml-4 text-brand-red hover:underline"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-bg text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {theatre.theatreName}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {theatre.location?.address}, {theatre.location?.city} {theatre.location?.pincode}
                        </p>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-3xl p-8 text-gray-800 shadow-xl max-w-4xl mx-auto">

                    {/* Date Selector */}
                    <div className="flex justify-center gap-4 mb-8 overflow-x-auto py-4">
                        {availableDates.map((date, index) => {
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex flex-col items-center justify-center w-16 h-20 rounded-xl transition-all ${isSelected
                                        ? 'bg-brand-red text-white shadow-lg scale-105'
                                        : 'bg-gray-100/50 hover:bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <span className="text-xs font-medium uppercase">
                                        {date.toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-xl font-bold">
                                        {date.getDate()}
                                    </span>
                                    <span className="text-xs">
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                </button>
                            );
                        })}
                        {availableDates.length === 0 && !loading && (
                            <div className="text-gray-500 py-4">No dates available</div>
                        )}
                    </div>

                    {/* Screen Selector */}
                    <div className="mb-8">
                        <label className="block text-gray-600 text-sm font-medium mb-3">
                            Select Screen
                        </label>
                        {loading ? (
                            <div className="text-gray-400 text-sm">Loading screens...</div>
                        ) : screens.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                                {screens.map((screen) => (
                                    <button
                                        key={screen.screenId}
                                        onClick={() => setSelectedScreen(screen.screenName)}
                                        className={`px-6 py-3 rounded-xl border transition-all ${selectedScreen === screen.screenName
                                            ? 'border-brand-red text-brand-red bg-red-50 font-medium'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {screen.screenName || `Screen ${screen.screenId}`}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-400 text-sm">No screens found for this theatre.</div>
                        )}
                    </div>

                    {/* Time Selector */}
                    <div className="mb-10">
                        <label className="block text-gray-600 text-sm font-medium mb-3">
                            Enter Show Time
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <select
                                    value={selectedTime.hour}
                                    onChange={(e) => setSelectedTime({ ...selectedTime, hour: e.target.value })}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-6 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red cursor-pointer min-w-[80px]"
                                >
                                    {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedTime.minute}
                                    onChange={(e) => setSelectedTime({ ...selectedTime, minute: e.target.value })}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-6 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red cursor-pointer min-w-[80px]"
                                >
                                    {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedTime.period}
                                    onChange={(e) => setSelectedTime({ ...selectedTime, period: e.target.value })}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-6 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red cursor-pointer min-w-[80px]"
                                >
                                    {periods.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Enter the show time as mentioned on your movie ticket.
                        </p>
                    </div>

                    {/* Proceed Button */}
                    <button
                        onClick={handleProceed}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 font-bold py-4 rounded-xl transition-all shadow-sm"
                    >
                        Proceed
                    </button>

                </div>
            </div>
        </div>
    );
};

export default BookSpecialMomentSchedulePage;
