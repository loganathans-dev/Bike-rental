import { Bike } from 'lucide-react';

/** Renders bike image from API/DB only — no stock or mock photos. */
export function BikeThumbnail({ bike, className = '', iconClassName = 'w-12 h-12 text-gray-300' }) {
  if (bike?.image) {
    return (
      <img
        src={bike.image}
        alt={bike.name || 'Bike'}
        className={className}
      />
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
      <Bike className={iconClassName} />
      <span className="text-[10px] font-medium mt-1 uppercase tracking-wide">No image</span>
    </div>
  );
}
