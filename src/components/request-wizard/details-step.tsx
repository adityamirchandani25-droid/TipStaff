"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MAX_PHOTOS = 3;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function DetailsStep({
  description,
  onDescriptionChange,
  photos,
  onPhotosChange,
  error,
}: {
  description: string;
  onDescriptionChange: (value: string) => void;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoError(null);

    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setPhotoError(`Up to ${MAX_PHOTOS} photos.`);
    }

    if (toAdd.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setPhotoError("Choose a JPG, PNG, or WebP photo.");
      return;
    }

    const oversized = toAdd.find((f) => f.size > MAX_FILE_BYTES);
    if (oversized) {
      setPhotoError("Each photo must be under 4MB.");
      return;
    }

    try {
      const dataUrls = await Promise.all(toAdd.map(readAsDataUrl));
      onPhotosChange([...photos, ...dataUrls]);
    } catch {
      setPhotoError("That photo couldn’t be opened. Please choose it again.");
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-tight text-ink-900">Tell us more</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        Describe the problem and what you’d like done. Photos are optional.
      </p>

      <div className="mt-6">
        <Label htmlFor="description">What&apos;s happening?</Label>
        <Textarea
          id="description"
          rows={5}
          maxLength={1000}
          placeholder="e.g. The kitchen faucet has been dripping steadily since this morning and the cabinet underneath is starting to feel damp."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          invalid={!!error}
        />
        {error ? (
          <p className="mt-1.5 text-[13px] text-red-600">{error}</p>
        ) : (
          <p className="mt-1.5 text-[13px] text-ink-500">{description.length}/1000</p>
        )}
      </div>

      <div className="mt-5">
        <Label htmlFor="photos">Photos (optional)</Label>
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-[var(--radius-md)] border border-border">
              {/* Local data-URL previews — next/image can't optimize these. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onPhotosChange(photos.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900/70 text-white opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-ink-300 text-ink-400 transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
              <span className="text-[11px] font-medium">Add</span>
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          id="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {photoError && <p className="mt-1.5 text-[13px] text-red-600">{photoError}</p>}
      </div>
    </div>
  );
}
