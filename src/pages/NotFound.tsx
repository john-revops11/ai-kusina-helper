
import { Link } from "react-router-dom";
import { CookingPot, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
      <CookingPot className="h-24 w-24 text-muted-foreground mb-6" />
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-xl text-muted-foreground mb-6">Recipe not found</p>
      <p className="text-center text-muted-foreground mb-8 max-w-md">
        The recipe you're looking for might have been moved or doesn't exist. 
        Let's find something delicious to cook instead!
      </p>
      <Link to="/">
        <Button className="flex items-center gap-2">
          <Home size={16} />
          Return to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
