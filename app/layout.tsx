import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', preload: true });

export const metadata: Metadata = {
  title: 'Devisia - Générez vos devis BTP en quelques minutes',
  description: 'Créez des devis professionnels pour vos chantiers en quelques minutes grâce à l\'IA. Dictez votre projet, obtenez un devis prêt à envoyer.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
