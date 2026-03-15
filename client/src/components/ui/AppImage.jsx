export default function AppImage({
  src,
  alt,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  sizes,
  className,
  ...props
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      sizes={sizes}
      className={className}
      {...props}
    />
  );
}
