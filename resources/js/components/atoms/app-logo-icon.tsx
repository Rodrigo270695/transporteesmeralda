import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/logo.png"
            alt="Trans. Esmeralda"
            className={props.className}
        />
    );
}
