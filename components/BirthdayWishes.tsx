
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Reusing BirthdayWishes component name to maintain imports
// but completely redesigning the content for "Special Moments"

const BirthdayWishes: React.FC = () => {
    const navigate = useNavigate();

    const handleBooking = (occasion: 'birthday' | 'moment' | 'valentine') => {
        navigate('/book-special-moment', { state: { occasion } });
    };

    return (
        <div className="w-full">
            {/* Header Section */}
            <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 leading-tight">
                    Make Your Special Moments <br className="hidden sm:block" />
                    <span className="text-brand-red">Play on the Big Screen! 🎬</span>
                </h2>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Birthdays Card */}
                <div className="bg-[#1a1c2e] rounded-2xl overflow-hidden border border-brand-red/20 hover:border-brand-red/60 transition-all duration-300 group hover:-translate-y-1 shadow-lg hover:shadow-brand-red/10 flex flex-col h-full">
                    <div className="p-5 pb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white">Birthdays!</h3>
                            <span className="text-2xl">🎂</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Make your loved one’s birthday unforgettable on the big screen
                        </p>
                    </div>

                    <div className="mt-auto relative h-60 overflow-hidden">
                        <img
                            src="/assets/images/cinema-birthday.png"
                            alt="Birthday Celebration"
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c2e] to-transparent opacity-60"></div>
                        <div className="absolute bottom-3 right-3">
                            <button onClick={() => handleBooking('birthday')} className="bg-brand-red text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Share the Moment Card */}
                <div className="bg-[#1a1c2e] rounded-2xl overflow-hidden border border-brand-red/20 hover:border-brand-red/60 transition-all duration-300 group hover:-translate-y-1 shadow-lg hover:shadow-brand-red/10 flex flex-col h-full">
                    <div className="p-5 pb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white">Share the moment!</h3>
                            <span className="text-2xl">📸</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            See yourself on the big screen, feel seen and celebrated
                        </p>
                    </div>

                    <div className="mt-auto relative h-60 overflow-hidden">
                        <img
                            src="/assets/images/couple-moment.png"
                            alt="Couple on Big Screen"
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c2e] to-transparent opacity-60"></div>
                        <div className="absolute bottom-3 right-3">
                            <button onClick={() => handleBooking('moment')} className="bg-brand-red text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Valentine's Card */}
                <div className="bg-[#1a1c2e] rounded-2xl overflow-hidden border border-brand-red/20 hover:border-brand-red/60 transition-all duration-300 group hover:-translate-y-1 shadow-lg hover:shadow-brand-red/10 flex flex-col h-full">
                    <div className="p-5 pb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white">Valentine's!</h3>
                            <span className="text-2xl">💖</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Express love in a grand, unforgettable way
                        </p>
                    </div>

                    <div className="mt-auto relative h-60 overflow-hidden">
                        <img
                            src="/assets/images/valentine-moment.png"
                            alt="Valentine Celebration"
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c2e] to-transparent opacity-60"></div>
                        <div className="absolute bottom-3 right-3">
                            <button onClick={() => handleBooking('valentine')} className="bg-brand-red text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BirthdayWishes;
