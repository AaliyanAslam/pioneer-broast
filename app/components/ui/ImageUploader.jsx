"use client";
import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { PiUploadSimple, PiCircleNotch } from "react-icons/pi";
import toast from "react-hot-toast";

export default function ImageUploader({ onImagesUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploading(true);
    setPreviews(files.map((file) => URL.createObjectURL(file)));

    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const fileExt = file.name.split(".").pop();
          // Generate 100% unique ID using crypto.randomUUID + timestamp
          const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          const fileName = `${Date.now()}-${uniqueId}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error } = await supabase.storage
            .from("product-images")
            .upload(filePath, file);

          if (error) {
            console.error("Supabase Storage Error:", error);
            throw new Error("Upload blocked. Check bucket permissions.");
          }

          // Safely extract public URL
          const { data } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);

          return data.publicUrl;
        })
      );

      toast.success("Images uploaded successfully!");
      onImagesUploaded(uploadedUrls.filter(Boolean)); // Send array back to parent
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Product Images
      </label>
      <div className="relative border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-300 group">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center text-zinc-400">
            <PiCircleNotch className="w-10 h-10 animate-spin mb-3 text-white" />
            <span className="text-sm font-medium">Uploading securely...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
            <PiUploadSimple className="w-10 h-10 mb-3" />
            <span className="text-sm font-semibold">Click or drag images to upload</span>
            <span className="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP up to 5MB</span>
          </div>
        )}
      </div>

      {previews.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          {previews.map((src, index) => (
            <div key={index} className="relative aspect-square rounded-lg border border-zinc-800 overflow-hidden shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`preview-${index}`} className="object-cover w-full h-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}