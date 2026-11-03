/** The media library's images that pages use (scripts/media/used-media.mjs), by file name. */
declare module 'virtual:techpi-media' {
  const images: Record<string, import('astro').ImageMetadata>;
  export default images;
}
