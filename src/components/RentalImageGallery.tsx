import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Building } from "lucide-react";
import { RentalProperty } from "../types";
import { getRentalLocalId } from "../utils";

interface RentalImageGalleryProps {
  rental: RentalProperty;
}

export const RentalImageGallery: React.FC<RentalImageGalleryProps> = ({
  rental,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [fallbackToAlternateExt, setFallbackToAlternateExt] = useState(false);
  const [isFailedCompletely, setIsFailedCompletely] = useState(false);
  const [localFolderImageCount, setLocalFolderImageCount] = useState<number | null>(null);

  // 1. Core ID parsing logic - streamlined utilizing the common helper
  const idValue = getRentalLocalId(rental);

  // 2. Fetch server folder inventory to discover files on disk for this ID
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      if (!idValue) return;
      try {
        const res = await fetch("/api/rentals-images-status");
        if (res.ok) {
          const data = await res.json();
          if (active && data && Array.isArray(data.folders)) {
            const match = data.folders.find(
              (f: any) =>
                String(f.name).toLowerCase().trim() === String(idValue).toLowerCase().trim()
            );
            if (match && match.count > 0) {
              setLocalFolderImageCount(match.count);
            } else {
              setLocalFolderImageCount(null);
            }
          }
        }
      } catch (err) {
        console.error("Image Gallery status fetch failed:", err);
      }
    };
    fetchStatus();
    return () => {
      active = false;
    };
  }, [idValue, rental]);

  useEffect(() => {
    setCurrentImgIndex(0);
    setFallbackToAlternateExt(false);
    setIsFailedCompletely(false);
  }, [rental, localFolderImageCount]);

  useEffect(() => {
    setFallbackToAlternateExt(false);
    setIsFailedCompletely(false);
  }, [currentImgIndex]);

  // 3. Formulate absolute image sources list
  const imagesToUse = useMemo(() => {
    // 3.1 First priority: If folder exists on server with files, generate references directly based on count
    if (localFolderImageCount !== null && localFolderImageCount > 0) {
      return Array.from(
        { length: localFolderImageCount },
        (_, i) => `/rentals_images/${idValue}/image_${i + 1}.jpg`
      );
    }

    // 3.2 Fallback: Prefer provided local images if they exist
    const localImgPaths = (rental.images || []).filter(
      (img) => img && (img.startsWith("/") || img.startsWith("rentals_images/"))
    );
    if (localImgPaths.length > 0) {
      return localImgPaths;
    }

    return [];
  }, [rental, localFolderImageCount, idValue]);

  const currentImgUrl = imagesToUse[currentImgIndex];

  // Robust path resolver
  const getImgSrc = () => {
    if (!currentImgUrl) return "";

    let src = currentImgUrl;
    if (!src.startsWith("/") && !src.startsWith("http")) {
      src = "/" + src;
    }

    // Direct extension toggles (avoid discarding completely valid paths)
    if (fallbackToAlternateExt) {
      if (src.toLowerCase().endsWith(".jpg")) {
        src = src.slice(0, -4) + ".png";
      } else if (src.toLowerCase().endsWith(".png")) {
        src = src.slice(0, -4) + ".jpg";
      } else if (src.toLowerCase().endsWith(".jpeg")) {
        src = src.slice(0, -5) + ".png";
      }
    }

    if (isFailedCompletely) {
      // Direct local fallback (no remote hotlinking)
      if (src.startsWith("/")) {
        return src;
      }
    }

    return src;
  };

  const handleImageError = () => {
    if (!fallbackToAlternateExt) {
      setFallbackToAlternateExt(true);
    } else if (!isFailedCompletely) {
      setIsFailedCompletely(true);
    }
  };

  return (
    <div className="space-y-1.5 relative group">
      <div className="aspect-video w-full bg-[#1e2330] rounded-lg overflow-hidden border border-white/5 relative flex items-center justify-center">
        {imagesToUse.length > 0 ? (
          <>
            <img
              src={getImgSrc()}
              alt="preview"
              onError={handleImageError}
              className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
            />
            {imagesToUse.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIndex((prev) =>
                      prev === 0 ? imagesToUse.length - 1 : prev - 1,
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
                      prev === imagesToUse.length - 1 ? 0 : prev + 1,
                    );
                  }}
                  className="absolute right-2 text-white bg-black/50 hover:bg-black/70 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 inset-x-0 flex flex-wrap justify-center gap-1.5 px-4 z-10">
                  {imagesToUse.map((_, idx) => (
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

