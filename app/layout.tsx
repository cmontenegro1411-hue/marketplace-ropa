import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Moda Circular | Marketplace de Ropa de Segunda Mano Premium",
  description: "Compra y vende ropa de segunda mano con estilo. Únete a la revolución de la moda sustentable con una experiencia premium y segura.",
  keywords: ["ropa de segunda mano", "moda circular", "sustentabilidad", "marketplace moda", "ropa vintage"],
  authors: [{ name: "Moda Circular Team" }],
  openGraph: {
    title: "Moda Circular | Marketplace Premium",
    description: "La plataforma líder para moda de segunda mano con conciencia ambiental.",
    type: "website",
  },
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${outfit.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster position="top-right" expand={false} richColors />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
