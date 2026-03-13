
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';


import { apiService } from '../services/api';

interface TheatreOwner {
    _id: string;
    theatreName: string;
    location: {
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
    };
    email?: string;
    phone?: string;
}

const TEMPLATES = [
    {
        id: 'sketches',
        name: 'Sketches',
        price: 180,
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop',
        defaultMessage: 'Happy Birthday',
        bgAnim: 'animate-pan-slow',
        textAnim: 'animate-bounce'
    },
    {
        id: 'bunny',
        name: 'Bunny and Butterflies',
        price: 300,
        url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600&auto=format&fit=crop',
        defaultMessage: 'Magical Birthday',
        bgAnim: 'animate-rotate-subtle',
        textAnim: 'animate-float'
    },
    {
        id: 'red-carpet',
        name: 'Red Carpet',
        price: 480,
        url: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?q=80&w=1000&auto=format&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?q=80&w=600&auto=format&fit=crop',
        defaultMessage: 'Star of the Day',
        bgAnim: 'animate-zoom-fade',
        textAnim: 'animate-focus-in'
    },
    {
        id: 'candles',
        name: 'Candles',
        price: 180,
        url: 'https://images.unsplash.com/photo-1464347744102-11db6282f854?q=80&w=1000&auto=format&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1464347744102-11db6282f854?q=80&w=600&auto=format&fit=crop',
        defaultMessage: 'Make a Wish',
        bgAnim: 'animate-pan-slow',
        textAnim: 'animate-pulse'
    },
    {
        id: 'neon-party',
        name: 'Neon Party',
        price: 480,
        url: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&q=80&w=1000',
        thumbnail: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&q=80&w=600',
        defaultMessage: 'Let\'s Dance',
        bgAnim: 'animate-zoom-fade',
        textAnim: 'animate-bounce'
    },
    {
        id: 'balloon',
        name: 'Balloon',
        price: 480,
        url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1000',
        thumbnail: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=600',
        defaultMessage: 'Let\'s Party!',
        bgAnim: 'animate-rotate-subtle',
        textAnim: 'animate-float'
    },
    {
        id: 'cupcake',
        name: 'Cupcake',
        price: 180,
        url: 'https://images.unsplash.com/photo-1587247960336-d08b46e45f94?auto=format&fit=crop&q=80&w=1000',
        thumbnail: 'https://images.unsplash.com/photo-1587247960336-d08b46e45f94?auto=format&fit=crop&q=80&w=600',
        defaultMessage: 'Sweetest Birthday',
        bgAnim: 'animate-pan-slow',
        textAnim: 'animate-slide-up'
    },
    {
        id: 'forest',
        name: 'Forest Adventure',
        price: 300,
        url: 'https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?q=80&w=1000&auto=format&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?q=80&w=600&auto=format&fit=crop',
        defaultMessage: 'Wild One',
        bgAnim: 'animate-zoom-fade',
        textAnim: 'animate-focus-in'
    },
    {
        id: 'gift-box',
        name: 'Gift Box',
        price: 480,
        url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1000&auto=format&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
        defaultMessage: 'Birthday Surprise',
        bgAnim: 'animate-rotate-subtle',
        textAnim: 'animate-bounce'
    }
];

const FONTS = [
    { name: 'Elegant', family: "'Dancing Script', cursive" },
    { name: 'Playful', family: "'Pacifico', cursive" },
    { name: 'Modern', family: "'Roboto', sans-serif" },
    { name: 'Classic', family: "'Cinzel', serif" },
    { name: 'Handwritten', family: "'Indie Flower', cursive" }
];

const BookSpecialMomentPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize with uploaded image if exists
    const [selectedImg, setSelectedImg] = useState<string | null>(location.state?.selectedImage || null);
    // Dynamic Animation States
    const [bgAnim, setBgAnim] = useState('animate-pan-slow');
    const [textAnim, setTextAnim] = useState('animate-bounce');

    // Customization State
    const [personName, setPersonName] = useState('Jude');
    const [message, setMessage] = useState('Happy Birthday');
    const [fromName, setFromName] = useState('');
    const [toName, setToName] = useState('');
    const [personPhoto, setPersonPhoto] = useState<string | null>(null);
    const [selectedFont, setSelectedFont] = useState(FONTS[0].family);

    const [searchTerm, setSearchTerm] = useState('');
    const [theatres, setTheatres] = useState<TheatreOwner[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // File handlers
    const handleCustomTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImg(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePersonPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPersonPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSearch = async (value: string) => {
        setSearchTerm(value);

        if (value.length >= 1) {
            setLoading(true);
            try {
                const response = await apiService.searchTheatreOwners(value);
                if (response.success && response.data) {
                    setTheatres(response.data);
                    setShowResults(true);
                }
            } catch (error) {
                console.error('Failed to search theatres:', error);
            } finally {
                setLoading(false);
            }
        } else {
            setTheatres([]);
            setShowResults(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg text-white">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Dancing+Script:wght@700&family=Indie+Flower&family=Pacifico&family=Roboto:wght@700&display=swap');
                    
                    @keyframes pan-slow {
                        0% { transform: scale(1) translate(0, 0); }
                        50% { transform: scale(1.1) translate(-2%, -2%); }
                        100% { transform: scale(1) translate(0, 0); }
                    }
                    @keyframes zoom-fade {
                        0% { transform: scale(1); opacity: 0.8; }
                        50% { transform: scale(1.05); opacity: 1; }
                        100% { transform: scale(1); opacity: 0.8; }
                    }
                    @keyframes rotate-subtle {
                        0% { transform: scale(1.05) rotate(-1deg); }
                        50% { transform: scale(1.1) rotate(1deg); }
                        100% { transform: scale(1.05) rotate(-1deg); }
                    }
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                        100% { transform: translateY(0px); }
                    }
                    @keyframes slide-up {
                        0% { transform: translateY(20px); opacity: 0; }
                        100% { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes focus-in {
                        0% { filter: blur(10px); opacity: 0; transform: scale(1.2); }
                        100% { filter: blur(0); opacity: 1; transform: scale(1); }
                    }
                    
                    .animate-pan-slow { animation: pan-slow 15s ease-in-out infinite; }
                    .animate-zoom-fade { animation: zoom-fade 10s ease-in-out infinite; }
                    .animate-rotate-subtle { animation: rotate-subtle 12s ease-in-out infinite; }
                    
                    .animate-float { animation: float 3s ease-in-out infinite; }
                    .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
                    .animate-focus-in { animation: focus-in 1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
                `}
            </style>
            {/* Search Header Section */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <div className="flex-1 max-w-4xl relative">
                        <input
                            type="text"
                            placeholder="Search Theatre"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-white text-gray-800 rounded-full px-6 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-brand-red text-lg shadow-lg"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>

                        {/* Search Results Dropdown */}
                        {showResults && searchTerm.length >= 1 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 text-center text-gray-500">Searching...</div>
                                ) : theatres.length > 0 ? (
                                    theatres.map((theatre) => (
                                        <div
                                            key={theatre._id}
                                            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group"
                                            onClick={() => {
                                                navigate('/book-special-moment/schedule', {
                                                    state: {
                                                        theatre,
                                                        selectedImage: selectedImg, // Pass the selected template/image
                                                        personName,
                                                        personPhoto,
                                                        selectedFont,
                                                        message,
                                                        fromName,
                                                        toName
                                                    }
                                                });
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-brand-red transition-colors">
                                                        {theatre.theatreName}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {theatre.location?.address}, {theatre.location?.city}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                        {theatre.location?.city}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">
                                        No theatres found matching "{searchTerm}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-white mb-3">Choose a Birthday Theme</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">Select a perfect backdrop for your big screen wish. Each template comes with unique animations!</p>
                </div>

                {/* Make hidden files inputs */}
                <input
                    type="file"
                    id="custom-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCustomTemplateUpload}
                />
                <input
                    type="file"
                    id="person-photo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePersonPhotoUpload}
                />


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Option to clear/upload new */}
                    <div
                        onClick={() => document.getElementById('custom-upload')?.click()}
                        className="bg-white rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:shadow-lg transition-all border-2 border-dashed border-gray-200 h-full min-h-[220px] group"
                    >
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 group-hover:text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h4 className="font-bold text-gray-800">Upload Your Own</h4>
                        <span className="text-gray-500 text-sm text-center mt-1">Design your own custom celebration card</span>
                    </div>

                    {TEMPLATES.map(template => (
                        <div
                            key={template.id}
                            onClick={() => {
                                setSelectedImg(template.url);
                                setMessage(template.defaultMessage);
                                setBgAnim(template.bgAnim);
                                setTextAnim(template.textAnim);
                            }}
                            className={`group cursor-pointer flex flex-col gap-3`}
                        >
                            <div className={`relative rounded-xl overflow-hidden aspect-[2/1] transition-all hover:shadow-xl ${selectedImg === template.url ? 'ring-4 ring-brand-red' : ''}`}>
                                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                {selectedImg === template.url && (
                                    <div className="absolute top-3 right-3 bg-brand-red text-white p-1.5 rounded-full shadow-lg z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-start px-1">
                                <h4 className="font-bold text-white group-hover:text-brand-red transition-colors text-lg">{template.name}</h4>
                                <span className="font-bold text-brand-red text-lg">₹{template.price}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Animated Preview Section */}
                {selectedImg && (
                    <div className="max-w-6xl mx-auto mb-16 px-4">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">Live Preview</h3>
                            <p className="text-gray-400">See how your special moment will look</p>
                        </div>

                        <div className="rounded-2xl overflow-hidden border-2 border-brand-red/30 shadow-[0_0_30px_rgba(229,9,20,0.3)] relative group mx-auto max-w-4xl bg-black">
                            {/* Base Template Image with Background Animation */}
                            <div className="relative overflow-hidden w-full h-[500px]">
                                <img
                                    src={selectedImg}
                                    alt="Selected Celebration"
                                    className={`w-full h-full object-cover opacity-80 ${bgAnim}`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                            </div>

                            {/* Overlays with Animations */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 z-10 text-center">

                                {/* Message (Top) */}
                                <h1 className={`text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] ${textAnim}`}
                                    style={{ fontFamily: selectedFont, textShadow: "0 0 20px rgba(255,0,255,0.8)" }}>
                                    {message}
                                </h1>

                                {/* Person Photo */}
                                {personPhoto && (
                                    <div className="my-4 rounded-full border-4 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.5)] overflow-hidden w-40 h-40 md:w-48 md:h-48 relative animate-pulse">
                                        <img src={personPhoto} alt={personName} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Person Name */}
                                {personName && (
                                    <h2 className={`text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] ${textAnim}`}
                                        style={{ fontFamily: selectedFont, textShadow: "0 0 30px rgba(0,255,255,0.6)", animationDuration: '3s' }}>
                                        {personName}
                                    </h2>
                                )}

                                {/* To/From Footer */}
                                {(fromName || toName) && (
                                    <div className="mt-4 flex gap-8 text-xl md:text-2xl text-white/90 font-light tracking-wide">
                                        {toName && <span>To: <span className="font-bold">{toName}</span></span>}
                                        {fromName && <span>From: <span className="font-bold">{fromName}</span></span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customization Form */}
                        <div className="mt-8 bg-gray-900/50 p-6 rounded-2xl border border-gray-800 max-w-4xl mx-auto backdrop-blur-sm">
                            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Customize Details
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Main Message</label>
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-gray-400 text-sm mb-2">Name on Card</label>
                                    <input
                                        type="text"
                                        value={personName}
                                        onChange={(e) => setPersonName(e.target.value)}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none"
                                    />
                                    {/* Font Selector Mini */}
                                    <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                                        {FONTS.map(f => (
                                            <button
                                                key={f.name}
                                                onClick={() => setSelectedFont(f.family)}
                                                className={`text-xs px-2 py-1 rounded border ${selectedFont === f.family ? 'bg-brand-red border-brand-red text-white' : 'border-gray-700 text-gray-400'}`}
                                                style={{ fontFamily: f.family }}
                                            >
                                                {f.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">From</label>
                                    <input
                                        type="text"
                                        value={fromName}
                                        onChange={(e) => setFromName(e.target.value)}
                                        placeholder="e.g. Mom & Dad"
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">To (Optional)</label>
                                    <input
                                        type="text"
                                        value={toName}
                                        onChange={(e) => setToName(e.target.value)}
                                        placeholder="e.g. My Dearest"
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-800 pt-6">
                                <label className="block text-gray-400 text-sm mb-2">Add a Photo</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => document.getElementById('person-photo-upload')?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {personPhoto ? 'Change Photo' : 'Upload Photo'}
                                    </button>
                                    {personPhoto && (
                                        <button onClick={() => setPersonPhoto(null)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookSpecialMomentPage;
