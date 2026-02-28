import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "흑과백 | Black & White",
  description: "더 지니어스 데스매치 - 1:1 숫자 타일 대결 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
