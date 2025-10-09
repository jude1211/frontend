import React, { useState, useEffect } from 'react';
import { convertToEmbedUrl, getVideoPlatform } from '../utils/videoUtils';

interface TrailerPlayerProps {
  trailerUrl: string;
  title: string;
  className?: string;
}

const TrailerPlayer: React.FC<TrailerPlayerProps> = ({ trailerUrl, title, className = '' }) => {
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (trailerUrl) {
      const convertedUrl = convertToEmbedUrl(trailerUrl);
      if (convertedUrl) {
        setEmbedUrl(convertedUrl);
        setError('');
      } else {
        const platform = getVideoPlatform(trailerUrl);
        setError(`Invalid ${platform} URL format`);
      }
    } else {
      setError('No trailer URL provided');
    }
    setIsLoading(false);
  }, [trailerUrl]);

  if (isLoading) {
    return (
      <div className={`aspect-video w-full rounded-lg overflow-hidden shadow-2xl bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Loading trailer...</p>
        </div>
      </div>
    );
  }

  if (error || !embedUrl) {
    return (
      <div className={`aspect-video w-full rounded-lg overflow-hidden shadow-2xl bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-white text-center p-8">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold mb-2">Trailer Not Available</h3>
          <p className="text-gray-400">
            {error || 'No trailer URL found for this movie.'}
          </p>
          {trailerUrl && (
            <div className="mt-4">
              <a
                href={trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <i className="fas fa-external-link-alt mr-2"></i>
                Watch on {getVideoPlatform(trailerUrl)}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-video w-full rounded-lg overflow-hidden shadow-2xl bg-black ${className}`}>
      <iframe
        className="w-full h-full"
        src={embedUrl}
        title={`${title} Trailer`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
};

export default TrailerPlayer;
