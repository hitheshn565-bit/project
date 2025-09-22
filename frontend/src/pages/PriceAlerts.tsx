import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAlertsStore } from "@/stores";

const PriceAlerts = () => {
  const { alerts } = useAlertsStore();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Price Alerts</h1>
        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No price alerts set</h3>
            <p className="text-muted-foreground">Set up alerts to get notified when prices drop</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Price alerts would be displayed here */}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PriceAlerts;