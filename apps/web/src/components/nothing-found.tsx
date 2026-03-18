import Image from 'next/image';

export function NothingFound({
  label = 'Nothing found.',
  image,
}: {
  label?: string;
  image?: { src: string; alt?: string; width?: number; height?: number };
}) {
  return (
    <div className="text-center text-gallery-gray py-24">
      {image && (
        <Image
          src={image.src}
          alt={image.alt ?? ''}
          width={image.width ?? 200}
          height={image.height ?? 200}
          className="mx-auto mb-4"
        />
      )}
      <p>{label}</p>
    </div>
  );
}
