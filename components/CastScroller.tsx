import React, { useEffect, useRef, useState } from 'react';

interface CastMember {
	name: string;
	character: string;
	profilePath?: string; // TMDB relative path like /abc.jpg
}

interface CastScrollerProps {
	cast: CastMember[];
	title?: string;
}

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

const CastScroller: React.FC<CastScrollerProps> = ({ cast = [], title = 'Cast' }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const evaluateScroll = () => {
		const el = containerRef.current;
		if (!el) { setCanScrollLeft(false); setCanScrollRight(false); return; }
		setCanScrollLeft(el.scrollLeft > 0);
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
	};

	useEffect(() => {
		evaluateScroll();
		const el = containerRef.current;
		if (!el) return;
		const onScroll = () => evaluateScroll();
		el.addEventListener('scroll', onScroll);
		window.addEventListener('resize', onScroll);
		return () => {
			el.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	}, [cast?.length]);

	const scrollByAmount = (dir: 'left' | 'right') => {
		const el = containerRef.current;
		if (!el) return;
		const delta = Math.floor(el.clientWidth * 0.85) * (dir === 'left' ? -1 : 1);
		el.scrollBy({ left: delta, behavior: 'smooth' });
	};
	if (!cast || cast.length === 0) {
		return (
			<div className="space-y-3">
				<h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
					<i className="fas fa-users text-red-600 mr-3"></i>
					{title}
				</h2>
				<div className="text-gray-400 text-sm">Cast details not available.</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
				<i className="fas fa-users text-red-600 mr-3"></i>
				{title}
			</h2>
			<div className="relative">
				{/* Scroll container (hidden scrollbar) */}
				<div ref={containerRef} className="flex gap-4 pb-2 overflow-x-hidden">
					{cast.map((c, idx) => {
						const imgSrc = c.profilePath ? `${TMDB_IMAGE_BASE_URL}${c.profilePath}` : '';
						return (
							<div key={`${c.name}-${idx}`} className="min-w-[140px] bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
								<div className="h-40 w-full bg-gray-700 flex items-center justify-center">
									{imgSrc ? (
										<img src={imgSrc} alt={c.name} className="h-full w-full object-cover" />
									) : (
										<i className="fas fa-user text-gray-400 text-3xl"></i>
									)}
								</div>
								<div className="p-3">
									<div className="text-white text-sm font-semibold truncate" title={c.name}>{c.name}</div>
									<div className="text-xs text-gray-400 truncate" title={c.character}>{c.character}</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Nav buttons like Netflix/HBO Max */}
				{canScrollLeft && (
					<button
						onClick={() => scrollByAmount('left')}
						className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-md"
						aria-label="Scroll left"
					>
						<i className="fas fa-chevron-left"></i>
					</button>
				)}
				{canScrollRight && (
					<button
						onClick={() => scrollByAmount('right')}
						className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-md"
						aria-label="Scroll right"
					>
						<i className="fas fa-chevron-right"></i>
					</button>
				)}
			</div>
		</div>
	);
};

export default CastScroller;


