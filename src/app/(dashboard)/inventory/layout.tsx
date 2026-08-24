import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inventory',
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
