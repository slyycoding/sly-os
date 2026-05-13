import { getUserOrDemo } from "@/lib/auth/getUser";
import { SearchClient } from "@/components/search/SearchClient";

export default async function SearchPage() {
  const { user } = await getUserOrDemo();

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <SearchClient userId={user.id} />
    </div>
  );
}
