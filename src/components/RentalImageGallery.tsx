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
  const [localFolderFiles, setLocalFolderFiles] = useState<string[]>([]);

  // 1. Core ID parsing logic - streamlined utilizing the common helper
  const idValue = getRentalLocalId(rental);

  // 2. Fetch server folder inventory to discover files on disk for this ID
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      if (!idValue) {
        setLocalFolderFiles([]);
        return;
      }
      try {
        const res = await fetch(`/api/rentals-images-status/${idValue}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data) {
            if (data.exists && Array.isArray(data.files) && data.files.length > 0) {
              setLocalFolderFiles(data.files);
            } else {
              setLocalFolderFiles([]);
            }
          }
        } else {
          if (active) setLocalFolderFiles([]);
        }
      } catch (err) {
        console.error("Image Gallery status fetch failed:", err);
        if (active) setLocalFolderFiles([]);
      }
    };
    fetchStatus();
    return () => {
      active = false;
    };
  }, [idValue, rental]);

  useEffect(() => {
    setCurrentImgIndex(0);
  }, [rental, localFolderFiles]);

  // 3. Formulate absolute image sources list
  const imagesToUse = useMemo(() => {
    // 3.1 First priority: If folder exists on server with files, map using the EXACT files returned by readdirSync to support .png, .jpg, etc. without breakage!
    if (localFolderFiles && localFolderFiles.length > 0) {
      // Natural sorting so image_1 is before image_10, etc.
      const sortedFiles = [...localFolderFiles].sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ""), 10) || 0;
        const numB = parseInt(b.replace(/[^0-9]/g, ""), 10) || 0;
        return numA - numB;
      });
      return sortedFiles.map((file) => `/rentals_images/${idValue}/${file}`);
    }

    // 3.2 Fallback: Prefer provided local images if they exist
    const localImgPaths = (rental.images || []).filter(
      (img) => img && (img.startsWith("/") || img.startsWith("rentals_images/"))
    );
    if (localImgPaths.length > 0) {
      return localImgPaths;
    }

    return [];
  }, [rental, localFolderFiles, idValue]);

  // Robust path resolver
  const getImgSrc = () => {
    const src = imagesToUse[currentImgIndex];
    if (!src) return "";
    if (!src.startsWith("/") && !src.startsWith("http")) {
      return "/" + src;
    }
    return src;
  };

  return (
    <div className="space-y-1.5 relative group">
      <div className="aspect-video w-full bg-[#1e2330] rounded-lg overflow-hidden border border-white/5 relative flex items-center justify-center">
        {imagesToUse.length > 0 ? (
          <>
            <img
              src={getImgSrc()}
              alt="preview"
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
                  className="absolute left-2 text-white bg-black/50 hover:bg-black/70 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer animate-fade-in"
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
                  className="absolute right-2 text-white bg-black/50 hover:bg-black/70 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer animate-fade-in"
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

