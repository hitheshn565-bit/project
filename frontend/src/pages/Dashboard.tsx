import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/stores";

const Dashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome {user?.name || 'User'}!</h1>
          <p className="text-muted-foreground">Your dashboard is coming soon.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;