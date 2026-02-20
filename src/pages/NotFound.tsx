import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-serif font-bold text-foreground">404</h1>
        <p className="text-base text-muted-foreground">Página não encontrada</p>
      </div>
    </div>
  );
};

export default NotFound;
