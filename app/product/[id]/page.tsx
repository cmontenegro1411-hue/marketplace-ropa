import { redirect } from 'next/navigation';

export default async function ProductRedirectPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  redirect(`/products/${id}`);
}
