
import { Link } from "react-router-dom";
import { CookingPot, Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  // Determine if the path is related to cooking or shopping
  const path = window.location.pathname;
  const isCookingRelated = path.includes('cook');
  const isShoppingRelated = path.includes('list') || path.includes('shopping');
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/10">
      <div className="w-full max-w-md">
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <CookingPot className="h-12 w-12 text-primary" />
            </div>
            
            <h1 className="text-4xl font-bold mb-2">404</h1>
            
            {isCookingRelated ? (
              <p className="text-xl text-muted-foreground mb-2">Recipe Not Found</p>
            ) : isShoppingRelated ? (
              <p className="text-xl text-muted-foreground mb-2">Shopping List Not Found</p>
            ) : (
              <p className="text-xl text-muted-foreground mb-2">Page Not Found</p>
            )}
            
            <p className="text-center text-muted-foreground mb-8 max-w-md">
              {isCookingRelated ? 
                "The recipe you're looking for might have been moved or doesn't exist yet. Let's find something delicious to cook!" :
                isShoppingRelated ?
                "The shopping list you're looking for isn't available. Let's create a new shopping list!" :
                "The page you're looking for might have been moved or doesn't exist. Let's get you back on track!"}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <Link to="/" className="flex-1">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <Home size={16} />
                  Home
                </Button>
              </Link>
              
              <Link to="/explore" className="flex-1">
                <Button className="w-full flex items-center justify-center gap-2">
                  <Search size={16} />
                  Explore Recipes
                </Button>
              </Link>
            </div>
            
            <Button 
              variant="ghost" 
              className="mt-6 text-muted-foreground"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
