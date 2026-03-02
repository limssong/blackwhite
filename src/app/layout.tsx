import type { Metadata } from "next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://limssong.github.io/blackwhite";
const BASE_PATH = process.env.NODE_ENV === "production" ? "/blackwhite" : "";
const canonicalUrl = `${SITE_URL}${BASE_PATH}`;

export const metadata: Metadata = {
  metadataBase: new URL(canonicalUrl),
  title: {
    default: "흑과백 | Black & White - 더 지니어스 숫자 타일 대결",
    template: "%s | 흑과백",
  },
  description:
    "더 지니어스 데스매치 룰의 1:1 숫자 타일 대결 게임. 0~8 타일로 9번 대결, 5선승. 1인 vs 컴퓨터, 2인 실시간 대전 지원.",
  keywords: [
    "흑과백",
    "Black and White",
    "더 지니어스",
    "데스매치",
    "숫자 타일 게임",
    "1:1 대결",
    "보드게임",
  ],
  authors: [{ name: "limssong", url: "https://github.com/limssong" }],
  creator: "limssong",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: canonicalUrl,
    siteName: "흑과백",
    title: "흑과백 | Black & White - 더 지니어스 숫자 타일 대결",
    description:
      "더 지니어스 데스매치 룰의 1:1 숫자 타일 대결. 1인 vs 컴퓨터, 2인 실시간 대전.",
  },
  twitter: {
    card: "summary_large_image",
    title: "흑과백 | Black & White",
    description: "더 지니어스 데스매치 - 1:1 숫자 타일 대결 게임",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: canonicalUrl,
  },
  verification: {
    // Google Search Console 등 검증 시 추가
    // google: "검증코드",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "흑과백",
  alternateName: "Black & White",
  description:
    "더 지니어스 데스매치 룰의 1:1 숫자 타일 대결 게임. 0~8 타일로 9번 대결, 5선승.",
  url: canonicalUrl,
  applicationCategory: "Game",
  inLanguage: "ko",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
