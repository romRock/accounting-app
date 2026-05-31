import Image, { type ImageProps } from 'next/image';
import { APP_NAME, LOGO_PATH } from '@/lib/app-branding';

type AppLogoProps = Omit<ImageProps, 'src' | 'alt'> & {
  alt?: string;
};

export function AppLogo({ alt, ...props }: AppLogoProps) {
  return (
    <Image
      src={LOGO_PATH}
      alt={alt ?? `${APP_NAME} logo`}
      unoptimized
      {...props}
    />
  );
}
