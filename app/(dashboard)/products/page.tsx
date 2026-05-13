import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { ProductsClient } from "@/components/products/ProductsClient";

export default async function ProductsPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <ProductsClient initialProducts={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").eq("user_id", user.id).order("category").order("name");

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <ProductsClient initialProducts={products ?? []} userId={user.id} />
    </div>
  );
}
