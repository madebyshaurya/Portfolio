import type { Metadata } from "next";
import localFont from "next/font/local";
import { Rock_Salt } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { Providers } from "@/components/providers";
import "./globals.css";

const editorialNew = localFont({
  src: [
    {
      path: "../fonts/PPEditorialNew-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/PPEditorialNew-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../fonts/PPEditorialNew-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/PPEditorialNew-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-editorial",
});

const rockSalt = Rock_Salt({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwritten",
});

export const metadata: Metadata = {
  title: "Shaurya Gupta",
  description: "Builder. 15. Toronto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${editorialNew.variable} ${rockSalt.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
