import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Building } from "lucide-react";
import { RentalProperty } from "../types";

interface RentalImageGalleryProps {
  rental: RentalProperty;
}

export const RentalImageGallery: React.FC<RentalImageGalleryProps> = ({
  rental,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [fallbackToAlternateExt, setFallbackToAlternateExt] = useState(false);
  const [isFailedCompletely, setIsFailedCompletely] = useState(false);

  useEffect(() => {
    setCurrentImgIndex(0);
    setFallbackToAlternateExt(false);
    setIsFailedCompletely(false);
  }, [rental]);

  useEffect(() => {
    setFallbackToAlternateExt(false);
    setIsFailedCompletely(false);
  }, [currentImgIndex]);

  // Helper to extract the 591 or dd-room ID from rental details
  const getCleanId = () => {
    if (rental.customFields?.original_591_id) {
      return rental.customFields.original_591_id;
    }
    if (rental.customFields?.original_id) {
      return rental.customFields.original_id;
    }

    const url = rental.link || rental.customFields?.source_591_url || "";
    const match591 = url.match(/(?:rent\.591\.com\.tw\/|detail-|id=)(\d+)/) || url.match(/\b(\d{7,9})\b/);
    if (match591) {
      return match591[1];
    }
    const matchDDRoom = url.match(/\/object\/([a-zA-Z0-9]+)/);
    if (matchDDRoom) {
      return matchDDRoom[1];
    }

    return rental.id.replace(/^rent_/, "");
  };

  const idValue = getCleanId();
  const currentImgUrl = rental.images && rental.images[currentImgIndex];

  // Robust image path resolver
  const getImgSrc = () => {
    if (!currentImgUrl) return "";

    // If it has completely failed, fallback to the original remote URL as a last resort
    if (isFailedCompletely) {
      return currentImgUrl;
    }

    // Determine target file extension
    const isPng = currentImgUrl.toLowerCase().includes(".png");
    const primaryExt = isPng ? "png" : "jpg";
    const alternateExt = isPng ? "jpg" : "png";
    const activeExt = fallbackToAlternateExt ? alternateExt : primaryExt;

    // If it's already a local path, use it directly (apply extension fallback if needed)
    if (currentImgUrl.startsWith("/") || !currentImgUrl.startsWith("http")) {
      if (fallbackToAlternateExt) {
        if (currentImgUrl.endsWith(".jpg")) return currentImgUrl.replace(/\.jpg$/, ".png");
        if (currentImgUrl.endsWith(".png")) return currentImgUrl.replace(/\.png$/, ".jpg");
      }
      return currentImgUrl;
    }

    // Rewrite remote URLs to local path
    return `/rentals_images/${idValue}/image_${currentImgIndex + 1}.${activeExt}`;
  };

  const handleImageError = () => {
    if (!fallbackToAlternateExt) {
      // First error: try switching extension (.jpg <-> .png)
      setFallbackToAlternateExt(true);
    } else if (!isFailedCompletely) {
      // Second error: fallback to original URL (remote hotlink, might fail but last resort)
      setIsFailedCompletely(true);
    }
  };

  return (
    <div className="space-y-1.5 relative group">
      <div className="aspect-video w-full bg-[#1e2330] rounded-lg overflow-hidden border border-white/5 relative flex items-center justify-center">
        {rental.images && rental.images.length > 0 ? (
          <>
            <img
              src={getImgSrc()}
              alt="preview"
              onError={handleImageError}
              className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
            />
            {rental.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIndex((prev) =>
                      prev === 0 ? rental.images.length - 1 : prev - 1,
                    );
                  }}
                  className="absolute left-2 text-white bg-black/50 hover:bg-black/70 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIndex((prev) =>
                      prev === rental.images.length - 1 ? 0 : prev + 1,
                    );
                  }}
                  className="absolute right-2 text-white bg-black/50 hover:bg-black/70 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 inset-x-0 flex flex-wrap justify-center gap-1.5 px-4 z-10">
                  {rental.images.map((_, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex(idx);
                      }}
                      className={`rounded-full cursor-pointer transition-all ${
                        idx === currentImgIndex
                          ? "w-2 h-2 bg-white scale-125"
                          : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80 mt-[1px]"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Building className="w-8 h-8 opacity-50" />
            <span className="text-xs font-mono">No Image</span>
          </div>
        )}
      </div>
    </div>
  );
};

