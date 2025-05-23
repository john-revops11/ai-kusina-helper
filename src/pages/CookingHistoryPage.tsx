
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import MobileNavBar from '@/components/MobileNavBar';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const cookingHistory = [
  {
    id: '1',
    recipeName: 'Adobo',
    date: '2023-09-15',
    imageUrl: 'https://images.unsplash.com/photo-1625640207684-cacc9be30530?q=80&w=2070',
  },
  {
    id: '2',
    recipeName: 'Sinigang',
    date: '2023-09-10',
    imageUrl: 'https://images.unsplash.com/photo-1576749872435-ff88a93b2412?q=80&w=2070',
  },
  {
    id: '3',
    recipeName: 'Pancit Canton',
    date: '2023-09-05',
    imageUrl: 'https://images.unsplash.com/photo-1570275239925-4af0aa93a0dc?q=80&w=2070',
  },
  {
    id: '4',
    recipeName: 'Halo-Halo',
    date: '2023-08-30',
    imageUrl: 'https://images.unsplash.com/photo-1628478955934-a8631511924e?q=80&w=2070',
  },
];

const CookingHistoryPage = () => {
  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 border-b flex items-center gap-2">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Cooking History</h1>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        <div className="grid gap-4">
          {cookingHistory.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0 flex">
                <div className="w-1/3">
                  <img 
                    src={item.imageUrl} 
                    alt={item.recipeName} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1617611647086-baf8019744ab?q=80&w=2070"; // Fallback image of Filipino food
                    }}
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{item.recipeName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cooked on {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <Link to={`/recipe/${item.id}`}>
                    <Button variant="ghost" size="sm" className="mt-2">
                      View Recipe
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {cookingHistory.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">You haven't cooked any recipes yet.</p>
            <Link to="/explore">
              <Button className="mt-4">Explore Recipes</Button>
            </Link>
          </div>
        )}
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default CookingHistoryPage;
