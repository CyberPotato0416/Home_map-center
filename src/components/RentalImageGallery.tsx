import React, { useState, useEffect, useMemo } from "react";
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
  const [localFolderImageCount, setLocalFolderImageCount] = useState<number | null>(null);

  // 1. Core ID parsing logic
  let idValue = rental.customFields?.original_591_id;

  // Case-insensitive/approximate matching in custom fields
  if (!idValue && rental.customFields) {
    for (const [k, v] of Object.entries(rental.customFields)) {
      const lk = k.toLowerCase().trim();
      if (
        (lk === "original_591_id" || 
         lk === "591_id" || 
         lk === "id_591" || 
         lk === "id" || 
         lk === "original_id" ||
         lk.includes("original_591") ||
         lk.includes("物編") ||
         lk.includes("編號")) && 
        v && 
        String(v).trim()
      ) {
        idValue = String(v).trim();
        break;
      }
    }
  }

  // Fallback to URL matching
  if (!idValue && rental.link) {
    const match = rental.link.match(/(\d{6,})/) || rental.link.match(/object\/([a-zA-Z0-9]+)/);
    if (match) {
      idValue = match[1];
    } else {
      const rencoMatch = rental.link.match(/renco.*\/(\d+)/) || rental.link.match(/renco_(\d+)/);
      if (rencoMatch) {
         idValue = `renco_${rencoMatch[1]}`;
      }
    }
  }

  // Fallback to searching inside images urls
  if (!idValue && rental.images && rental.images.length > 0) {
    for (const img of rental.images) {
      if (!img) continue;
      const s3Renco = img.match(/renco-rentals-prod.*\/(\d+)\/medium/) || img.match(/s3.*renco.*\/(\d+)\//);
      if (s3Renco) {
        idValue = `renco_${s3Renco[1]}`;
        break;
      }
      const localFolder = img.match(/rentals_images\/([a-zA-Z0-9_\-]+)/);
      if (localFolder && localFolder[1] !== "rentals_images" && !localFolder[1].startsWith("[") && !localFolder[1].startsWith("http")) {
        idValue = localFolder[1];
        break;
      }
    }
  }

  // Ultimate fallback to primary ID
  if (!idValue) {
    idValue = rental.id;
  }

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
            const match = data.folders.find((f: any) => 
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
    if (rental.images && rental.images.length > 0) {
      return rental.images;
    }
    if (localFolderImageCount !== null && localFolderImageCount > 0) {
      // Build safe local references
      return Array.from({ length: localFolderImageCount }, (_, i) => 
        `/rentals_images/${idValue}/image_${i + 1}.jpg`
      );
    }
    return [];
  }, [rental.images, localFolderImageCount, idValue]);

  const currentImgUrl = imagesToUse[currentImgIndex];

  // Robust path resolver
  const getImgSrc = () => {
    if (!currentImgUrl) return "";

    const isPng = currentImgUrl.toLowerCase().includes(".png");
    const primaryExt = isPng ? "png" : "jpg";
    const alternateExt = isPng ? "jpg" : "png";
    const activeExt = fallbackToAlternateExt ? alternateExt : primaryExt;

    const localPath = `/rentals_images/${idValue}/image_${currentImgIndex + 1}.${activeExt}`;

    if (isFailedCompletely) {
      // Last resort fallback
      if (currentImgUrl.startsWith("http")) {
        return currentImgUrl;
      }
      return `https://raw.githubusercontent.com/CyberPotato0416/Home_map-center/main/public${localPath}`;
    }

    return localPath;
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

