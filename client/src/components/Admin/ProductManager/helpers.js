export const PRODUCT_IMAGES_BUCKET_MARKER = "/product-images/";

export function extractProductImagePath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const markerIndex = imageUrl.indexOf(PRODUCT_IMAGES_BUCKET_MARKER);
  if (markerIndex === -1) return null;
  return imageUrl.substring(markerIndex + PRODUCT_IMAGES_BUCKET_MARKER.length);
}
