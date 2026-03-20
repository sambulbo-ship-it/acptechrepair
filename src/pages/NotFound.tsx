import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wrench, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const fr = language === 'fr';

  return (
    <div className="min-h-screen bg-[#0a0c0f] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative glass-card p-10 text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-8 h-8 text-primary" />
        </div>
        <p className="text-7xl font-extrabold text-primary mb-4">404</p>
        <h1 className="text-xl font-semibold text-white mb-2">
          {fr ? 'Page introuvable' : 'Page not found'}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {fr
            ? "Cette page n'existe pas ou a été déplacée."
            : "This page doesn't exist or has been moved."}
        </p>
        <Button
          onClick={() => navigate('/')}
          className="w-full gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {fr ? 'Retour à l\'accueil' : 'Back to home'}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
