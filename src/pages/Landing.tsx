import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Wrench,
  BarChart3,
  Users,
  Smartphone,
  Globe,
  Scan,
  Bot,
  ShoppingCart,
  ChevronRight,
  CheckCircle2,
  Star,
  Building2,
  ArrowRight,
  Monitor,
  Apple,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Landing = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fr = language === 'fr';

  const features = [
    {
      icon: Wrench,
      title: fr ? 'Suivi des réparations' : 'Repair Tracking',
      desc: fr
        ? 'Enregistrez chaque diagnostic, réparation et remplacement avec photos et historique complet.'
        : 'Log every diagnostic, repair, and replacement with photos and full history.',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      icon: Scan,
      title: fr ? 'Scan QR / Code-barres' : 'QR / Barcode Scanning',
      desc: fr
        ? "Identifiez instantanément n'importe quel équipement en scannant son code ou en prenant une photo."
        : 'Instantly identify any equipment by scanning its code or taking a photo.',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      icon: Bot,
      title: fr ? 'Assistant IA' : 'AI Assistant',
      desc: fr
        ? "L'IA analyse les pannes, suggère des solutions et reconnaît les équipements à partir de photos."
        : 'AI analyses faults, suggests solutions, and recognises equipment from photos.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      icon: Users,
      title: fr ? 'Gestion d\'équipe' : 'Team Management',
      desc: fr
        ? 'Invitez vos techniciens, attribuez des rôles et suivez qui a fait quoi.'
        : 'Invite technicians, assign roles, and track who did what.',
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      icon: Building2,
      title: fr ? 'Multi-entreprises' : 'Multi-company',
      desc: fr
        ? 'Chaque entreprise dispose de son propre espace de travail isolé avec ses données privées.'
        : 'Each company gets its own isolated workspace with private data.',
      color: 'text-pink-400',
      bg: 'bg-pink-400/10',
    },
    {
      icon: BarChart3,
      title: fr ? 'Analytique' : 'Analytics',
      desc: fr
        ? 'Tableau de bord des statistiques : taux de pannes, temps de réparation, équipements critiques.'
        : 'Stats dashboard: fault rates, repair times, critical equipment.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      icon: ShoppingCart,
      title: fr ? 'Location & Vente' : 'Rental & Sale',
      desc: fr
        ? 'Gérez la location et la vente de votre parc matériel directement depuis l\'application.'
        : 'Manage rental and sale of your equipment fleet directly from the app.',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      icon: Globe,
      title: fr ? 'Catalogue public' : 'Public Catalog',
      desc: fr
        ? 'Partagez un catalogue de vos services de réparation accessible à tous vos clients.'
        : 'Share a public catalog of your repair services accessible to all your clients.',
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
    },
  ];

  const platforms = [
    {
      icon: Globe,
      label: 'Web',
      desc: fr ? 'Navigateur — aucune installation' : 'Browser — no install needed',
    },
    {
      icon: Apple,
      label: 'iOS / iPadOS',
      desc: fr ? 'iPhone & iPad natif' : 'Native iPhone & iPad',
    },
    {
      icon: Smartphone,
      label: 'Android',
      desc: fr ? 'Tous smartphones Android' : 'All Android smartphones',
    },
    {
      icon: Monitor,
      label: 'PWA',
      desc: fr ? 'Installable sur bureau' : 'Installable on desktop',
    },
  ];

  const benefits = fr
    ? [
        'Accès hors-ligne — fonctionne sans connexion',
        'Notifications push en temps réel',
        'Sécurisé — données chiffrées et isolées par entreprise',
        'Bilingue FR / EN',
        'Gratuit pour commencer',
      ]
    : [
        'Offline access — works without a connection',
        'Real-time push notifications',
        'Secure — encrypted data isolated per company',
        'Bilingual FR / EN',
        'Free to get started',
      ];

  return (
    <div className="min-h-screen bg-[#0a0c0f] text-foreground overflow-x-hidden">
      {/* Sticky nav */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3',
          scrolled ? 'bg-[#0a0c0f]/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent',
        )}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">ACP Tech Repair</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(fr ? 'en' : 'fr')}
              className="text-xs text-muted-foreground hover:text-white px-2 py-1 rounded-md transition-colors"
            >
              {fr ? 'EN' : 'FR'}
            </button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="border-white/10 text-white hover:bg-white/5 text-xs"
            >
              {fr ? 'Connexion' : 'Sign in'}
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/auth')}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
            >
              {fr ? "S'inscrire" : 'Sign up'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center relative">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-3 py-1 mb-6">
            <Star className="w-3 h-3" />
            {fr ? 'Disponible sur Web, iOS, iPadOS & Android' : 'Available on Web, iOS, iPadOS & Android'}
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            {fr
              ? 'La gestion de parc technique,\n'
              : 'Equipment management,\n'}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              {fr ? 'pour toutes les entreprises' : 'for every company'}
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {fr
              ? "Suivez l'historique de chaque machine, gérez vos équipes de techniciens, scannez et diagnostiquez avec l'IA — le tout en FR et EN, sur tous vos appareils."
              : 'Track every machine\'s history, manage your technician teams, scan and diagnose with AI — all in FR and EN, on all your devices.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-blue-500 hover:bg-blue-600 text-white gap-2 h-12 px-8 text-base font-semibold shadow-lg shadow-blue-500/25"
            >
              {fr ? 'Commencer gratuitement' : 'Get started for free'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/find-repair')}
              className="border-white/10 text-white hover:bg-white/5 h-12 px-8 text-base"
            >
              {fr ? 'Trouver un service' : 'Find a repair service'}
            </Button>
          </div>
        </div>
      </section>

      {/* Platform badges */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {platforms.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/3 border border-white/5 text-center"
            >
              <Icon className="w-6 h-6 text-blue-400" />
              <span className="text-sm font-semibold text-white">{label}</span>
              <span className="text-xs text-muted-foreground leading-snug">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
            {fr ? 'Tout ce dont votre équipe a besoin' : 'Everything your team needs'}
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {fr
              ? 'Une application complète, multi-plateforme, pensée pour les équipes techniques professionnelles.'
              : 'A complete, multi-platform app built for professional technical teams.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="p-5 rounded-2xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', bg)}>
                  <Icon className={cn('w-5 h-5', color)} />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits list */}
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-8">
            {fr ? 'Pourquoi ACP Tech Repair ?' : 'Why ACP Tech Repair?'}
          </h2>
          <ul className="space-y-3 text-left inline-block">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-60 bg-blue-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            {fr ? 'Prêt à démarrer ?' : 'Ready to start?'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {fr
              ? 'Créez votre espace de travail en moins de 2 minutes. Aucune carte bancaire requise.'
              : 'Create your workspace in under 2 minutes. No credit card required.'}
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-blue-500 hover:bg-blue-600 text-white gap-2 h-12 px-10 text-base font-semibold shadow-lg shadow-blue-500/25"
          >
            {fr ? 'Créer mon compte' : 'Create my account'}
            <ChevronRight className="w-4 h-4" />
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            {fr
              ? 'Déjà un compte ? '
              : 'Already have an account? '}
            <button
              onClick={() => navigate('/auth')}
              className="text-blue-400 hover:underline"
            >
              {fr ? 'Se connecter' : 'Sign in'}
            </button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center">
            <Wrench className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="font-semibold text-white">ACP Tech Repair</span>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate('/find-repair')} className="hover:text-white transition-colors">
            {fr ? 'Trouver un réparateur' : 'Find repair service'}
          </button>
          <button onClick={() => navigate('/catalog')} className="hover:text-white transition-colors">
            {fr ? 'Catalogue' : 'Catalog'}
          </button>
          <button onClick={() => navigate('/install')} className="hover:text-white transition-colors">
            {fr ? 'Installer l\'app' : 'Install app'}
          </button>
          <button onClick={() => navigate('/auth')} className="hover:text-white transition-colors">
            {fr ? 'Connexion' : 'Sign in'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
