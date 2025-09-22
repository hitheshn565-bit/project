import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useWishlistStore } from "@/stores";

const Wishlist = () => {
  const { items } = useWishlistStore();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
        {items.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground">Add products to your wishlist to save them for later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Wishlist items would be displayed here */}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;