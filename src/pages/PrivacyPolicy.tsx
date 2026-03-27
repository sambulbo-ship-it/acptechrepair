import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Mail, MapPin, Calendar } from 'lucide-react';

const LAST_UPDATE = '27 mars 2026';
const COMPANY = 'Animal Coat Production';
const COMPANY_SHORT = 'ACP';
const DPO_EMAIL = 'privacy@animalcoatproduction.be';
const CONTACT_EMAIL = 'contact@animalcoatproduction.be';
const COUNTRY = 'Belgique';
const SUPERVISORY_AUTHORITY = "Autorité de protection des données (APD) — autorité de contrôle belge";
const APD_URL = 'https://www.autoriteprotectiondonnees.be';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold text-foreground border-b border-border/50 pb-2">{title}</h2>
    <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-xl transition-colors"
            aria-label="Retour"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-base font-semibold text-foreground">Politique de confidentialité</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Meta info */}
        <div className="glass-card p-5 space-y-2">
          <p className="text-xl font-bold text-foreground">{COMPANY}</p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Dernière mise à jour : {LAST_UPDATE}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {COUNTRY} · Droit belge · RGPD (UE) 2016/679
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {DPO_EMAIL}
            </span>
          </div>
        </div>

        {/* 1. Identité du responsable */}
        <Section title="1. Identité du responsable du traitement">
          <p>
            Le responsable du traitement est <strong className="text-foreground">{COMPANY}</strong> («&nbsp;{COMPANY_SHORT}&nbsp;»,
            «&nbsp;nous&nbsp;»), société de droit belge, dont le siège social est établi en {COUNTRY}.
          </p>
          <p>
            Pour toute question relative à la protection de vos données personnelles, vous pouvez nous
            contacter à l'adresse suivante&nbsp;:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>E-mail DPO : <a href={`mailto:${DPO_EMAIL}`} className="text-primary underline">{DPO_EMAIL}</a></li>
            <li>E-mail général : <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a></li>
          </ul>
        </Section>

        {/* 2. Données collectées */}
        <Section title="2. Données personnelles que nous collectons">
          <p>Dans le cadre de l'utilisation de la plateforme {COMPANY_SHORT} Tech Repair («&nbsp;la Plateforme&nbsp;»), nous traitons les catégories de données suivantes&nbsp;:</p>
          <div className="space-y-3">
            <div className="glass-stats p-3 rounded-xl space-y-1">
              <p className="font-medium text-foreground text-xs uppercase tracking-wide">Données d'identification et de compte</p>
              <p>Adresse e-mail, identifiant unique (UUID) généré lors de l'inscription, horodatage de création du compte.</p>
            </div>
            <div className="glass-stats p-3 rounded-xl space-y-1">
              <p className="font-medium text-foreground text-xs uppercase tracking-wide">Données d'utilisation opérationnelle</p>
              <p>Informations relatives aux équipements enregistrés (nom, marque, modèle, numéro de série interne, emplacement, statut, photos, notes de réparation), historique des interventions, données de scan de code-barres et QR, historique des scans.</p>
            </div>
            <div className="glass-stats p-3 rounded-xl space-y-1">
              <p className="font-medium text-foreground text-xs uppercase tracking-wide">Données d'espace de travail</p>
              <p>Appartenance à un espace de travail («&nbsp;workspace&nbsp;»), rôle au sein de l'espace (administrateur ou membre), paramètres de personnalisation (marques personnalisées, logo, couleurs).</p>
            </div>
            <div className="glass-stats p-3 rounded-xl space-y-1">
              <p className="font-medium text-foreground text-xs uppercase tracking-wide">Données techniques et de navigation</p>
              <p>Adresse IP (traitée par l'infrastructure cloud), informations sur l'appareil (type, système d'exploitation, navigateur), journaux d'accès anonymisés, préférences de notification push.</p>
            </div>
            <div className="glass-stats p-3 rounded-xl space-y-1">
              <p className="font-medium text-foreground text-xs uppercase tracking-wide">Données commerciales (module location/vente)</p>
              <p>Demandes de devis reçues, informations de contact des demandeurs de service (nom, coordonnées si renseignées volontairement).</p>
            </div>
          </div>
          <p className="font-medium text-foreground">
            Nous ne collectons pas de données sensibles (catégories particulières au sens de l'article 9 du RGPD) telles que données de santé, opinions politiques, données biométriques ou données relatives à des infractions.
          </p>
        </Section>

        {/* 3. Finalités et bases légales */}
        <Section title="3. Finalités du traitement et bases légales">
          <p>Conformément à l'article 6 du RGPD, nos traitements reposent sur les bases légales suivantes&nbsp;:</p>
          <div className="space-y-3">
            <div className="border-l-4 border-primary pl-4 space-y-1">
              <p className="font-medium text-foreground">Exécution du contrat (art. 6.1.b RGPD)</p>
              <p>Fourniture et gestion de la Plateforme de gestion de stock, authentification des utilisateurs, synchronisation des données entre appareils, gestion des espaces de travail et des équipes.</p>
            </div>
            <div className="border-l-4 border-success/60 pl-4 space-y-1">
              <p className="font-medium text-foreground">Intérêt légitime (art. 6.1.f RGPD)</p>
              <p>Amélioration de la Plateforme, détection et prévention des abus, sécurité informatique, statistiques d'utilisation agrégées et anonymisées. Vous disposez d'un droit d'opposition à ce traitement (voir section 7).</p>
            </div>
            <div className="border-l-4 border-warning/60 pl-4 space-y-1">
              <p className="font-medium text-foreground">Consentement (art. 6.1.a RGPD)</p>
              <p>Notifications push (accordées explicitement par l'utilisateur depuis les paramètres de la Plateforme ou du système d'exploitation). Vous pouvez retirer ce consentement à tout moment depuis les paramètres de notifications.</p>
            </div>
            <div className="border-l-4 border-muted-foreground/40 pl-4 space-y-1">
              <p className="font-medium text-foreground">Obligation légale (art. 6.1.c RGPD)</p>
              <p>Conservation de certaines données à des fins comptables ou légales imposées par le droit belge ou européen.</p>
            </div>
          </div>
        </Section>

        {/* 4. Conservation */}
        <Section title="4. Durées de conservation">
          <div className="space-y-2">
            <div className="flex justify-between items-start py-2 border-b border-border/30 gap-4">
              <span className="font-medium text-foreground min-w-0">Données de compte</span>
              <span className="text-right shrink-0">Jusqu'à suppression du compte + 30 jours de grâce</span>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-border/30 gap-4">
              <span className="font-medium text-foreground min-w-0">Données d'inventaire et d'interventions</span>
              <span className="text-right shrink-0">Durée de vie du compte, puis suppression à la demande ou automatiquement après inactivité de 24 mois</span>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-border/30 gap-4">
              <span className="font-medium text-foreground min-w-0">Journaux techniques</span>
              <span className="text-right shrink-0">90 jours glissants</span>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-border/30 gap-4">
              <span className="font-medium text-foreground min-w-0">Données de facturation / légales</span>
              <span className="text-right shrink-0">7 ans (obligation légale belge — loi du 17 juillet 1975 sur la comptabilité)</span>
            </div>
            <div className="flex justify-between items-start py-2 gap-4">
              <span className="font-medium text-foreground min-w-0">Données de notification push</span>
              <span className="text-right shrink-0">Jusqu'à révocation du consentement</span>
            </div>
          </div>
        </Section>

        {/* 5. Destinataires */}
        <Section title="5. Destinataires et sous-traitants">
          <p>Vos données peuvent être partagées avec les sous-traitants suivants, dans le strict cadre de la prestation de service&nbsp;:</p>
          <div className="space-y-2">
            <div className="glass-stats p-3 rounded-xl">
              <p className="font-medium text-foreground">Supabase Inc. (États-Unis)</p>
              <p>Infrastructure de base de données et d'authentification. Les données sont hébergées dans la région <strong className="text-foreground">EU West (Irlande)</strong> conformément aux garanties RGPD. Supabase est soumis aux clauses contractuelles types de la Commission européenne (CCT).</p>
            </div>
            <div className="glass-stats p-3 rounded-xl">
              <p className="font-medium text-foreground">Cloudflare Inc. (États-Unis)</p>
              <p>CDN et hébergement des actifs statiques de la Plateforme. Traitement effectué en partie dans l'EEE. Cloudflare est certifié au mécanisme de conformité UE–États-Unis (Data Privacy Framework).</p>
            </div>
            <div className="glass-stats p-3 rounded-xl">
              <p className="font-medium text-foreground">Fournisseurs de services de notification push</p>
              <p>Apple Push Notification service (APNs) et/ou Google Firebase Cloud Messaging (FCM), selon l'appareil de l'utilisateur — uniquement si le consentement aux notifications a été accordé.</p>
            </div>
          </div>
          <p>
            Nous ne vendons pas vos données personnelles à des tiers. Aucun transfert de données à des fins publicitaires n'est effectué.
          </p>
          <p>
            Pour les transferts hors EEE (Supabase, Cloudflare), des garanties appropriées conformes au chapitre V du RGPD (clauses contractuelles types ou mécanisme d'adéquation) sont en place.
          </p>
        </Section>

        {/* 6. Sécurité */}
        <Section title="6. Sécurité des données">
          <p>
            {COMPANY_SHORT} met en œuvre des mesures techniques et organisationnelles appropriées conformément à l'article 32 du RGPD&nbsp;:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Chiffrement des données en transit (TLS 1.2+) et au repos (AES-256)</li>
            <li>Authentification sécurisée via JWT avec rotation automatique des tokens</li>
            <li>Isolation des données par espace de travail (Row-Level Security Supabase)</li>
            <li>Accès aux données de production strictement limité au personnel autorisé</li>
            <li>Surveillance continue des accès et des anomalies</li>
            <li>Politique de sauvegarde quotidienne avec rétention chiffrée</li>
          </ul>
          <p>
            En cas de violation de données à caractère personnel susceptible d'engendrer un risque élevé pour vos droits et libertés, vous serez notifié dans les meilleurs délais conformément à l'article 34 du RGPD.
          </p>
        </Section>

        {/* 7. Droits */}
        <Section title="7. Vos droits">
          <p>Conformément aux articles 15 à 22 du RGPD et à la loi belge du 30 juillet 2018 relative à la protection des personnes physiques à l'égard des traitements de données à caractère personnel, vous disposez des droits suivants&nbsp;:</p>
          <div className="space-y-2">
            {[
              { right: 'Droit d\'accès (art. 15)', desc: 'Obtenir confirmation du traitement de vos données et en recevoir une copie.' },
              { right: 'Droit de rectification (art. 16)', desc: 'Faire corriger des données inexactes ou incomplètes vous concernant.' },
              { right: 'Droit à l\'effacement (art. 17)', desc: 'Demander la suppression de vos données, dans les limites légales (notamment comptables).' },
              { right: 'Droit à la limitation du traitement (art. 18)', desc: 'Demander la suspension temporaire du traitement dans les cas prévus par le RGPD.' },
              { right: 'Droit à la portabilité (art. 20)', desc: 'Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.' },
              { right: 'Droit d\'opposition (art. 21)', desc: 'Vous opposer au traitement fondé sur notre intérêt légitime. Nous cesserons sauf motifs légitimes impérieux.' },
              { right: 'Droit de retrait du consentement', desc: 'Retirer à tout moment votre consentement aux notifications push, sans affecter la licéité du traitement antérieur.' },
              { right: 'Droit de ne pas faire l\'objet d\'une décision automatisée', desc: 'Aucune décision entièrement automatisée produisant des effets juridiques n\'est prise sur la base de vos données.' },
            ].map(item => (
              <div key={item.right} className="glass-stats p-3 rounded-xl">
                <p className="font-medium text-foreground">{item.right}</p>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
          <p>
            Pour exercer vos droits, contactez-nous à&nbsp;:
            <a href={`mailto:${DPO_EMAIL}`} className="text-primary underline ml-1">{DPO_EMAIL}</a>.
            Nous répondrons dans un délai d'un mois (prolongeable de deux mois en cas de demandes complexes).
            Nous pourrons vous demander de justifier votre identité.
          </p>
          <p>
            Si vous estimez que le traitement de vos données porte atteinte à vos droits, vous avez le droit d'introduire une réclamation auprès de l'{SUPERVISORY_AUTHORITY}&nbsp;:
            <a href={APD_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1">{APD_URL}</a>.
          </p>
        </Section>

        {/* 8. Cookies */}
        <Section title="8. Cookies et technologies similaires">
          <p>La Plateforme utilise un nombre minimal de technologies de stockage local&nbsp;:</p>
          <div className="space-y-2">
            <div className="flex justify-between items-start py-2 border-b border-border/30 gap-4">
              <div>
                <p className="font-medium text-foreground">Session de connexion (JWT)</p>
                <p>Nécessaire au fonctionnement de la Plateforme</p>
              </div>
              <span className="text-right shrink-0 text-xs bg-secondary px-2 py-1 rounded">Essentiel</span>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-border/30 gap-4">
              <div>
                <p className="font-medium text-foreground">Préférences utilisateur (langue, thème)</p>
                <p>localStorage — aucune donnée personnelle transmise à des tiers</p>
              </div>
              <span className="text-right shrink-0 text-xs bg-secondary px-2 py-1 rounded">Essentiel</span>
            </div>
            <div className="flex justify-between items-start py-2 gap-4">
              <div>
                <p className="font-medium text-foreground">Données hors-ligne (cache PWA)</p>
                <p>IndexedDB local — synchronisation différée en cas de perte de connexion</p>
              </div>
              <span className="text-right shrink-0 text-xs bg-secondary px-2 py-1 rounded">Essentiel</span>
            </div>
          </div>
          <p>
            Nous n'utilisons pas de cookies publicitaires, de traceurs de réseaux sociaux ou d'outils d'analyse tiers collectant des données personnelles identifiables. Aucun bandeau de consentement aux cookies n'est requis pour les cookies strictement nécessaires au fonctionnement du service (directive ePrivacy / loi belge du 13 juin 2005 modifiée).
          </p>
        </Section>

        {/* 9. Mineurs */}
        <Section title="9. Protection des mineurs">
          <p>
            La Plateforme est destinée à des professionnels et entreprises. Elle n'est pas destinée aux personnes de moins de 16 ans. Nous ne collectons pas sciemment de données relatives à des mineurs. Si vous estimez qu'un mineur nous a communiqué des données, contactez-nous à <a href={`mailto:${DPO_EMAIL}`} className="text-primary underline">{DPO_EMAIL}</a>.
          </p>
        </Section>

        {/* 10. Modifications */}
        <Section title="10. Modifications de la présente politique">
          <p>
            Nous pouvons modifier cette politique pour refléter des évolutions légales ou fonctionnelles. En cas de modification substantielle, vous serez notifié par e-mail ou via la Plateforme au moins 30 jours avant l'entrée en vigueur des changements. La date de dernière mise à jour figure en en-tête de ce document.
          </p>
          <p>
            La poursuite de l'utilisation de la Plateforme après la date d'entrée en vigueur des modifications vaut acceptation de la politique mise à jour.
          </p>
        </Section>

        {/* 11. Droit applicable */}
        <Section title="11. Droit applicable et juridiction compétente">
          <p>
            La présente politique est régie par le droit belge et le Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (RGPD). En cas de litige, les tribunaux belges compétents seront seuls habilités à statuer, sous réserve du droit de recours auprès de l'APD.
          </p>
        </Section>

        {/* Contact block */}
        <div className="glass-card p-5 space-y-3 border border-primary/20">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <p className="font-semibold text-foreground">Contact protection des données</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Pour tout exercice de droit ou question relative à vos données personnelles&nbsp;:
          </p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${DPO_EMAIL}`} className="text-primary underline">{DPO_EMAIL}</a>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{COMPANY} — {COUNTRY}</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-8">
          © {new Date().getFullYear()} {COMPANY} · Tous droits réservés
        </p>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
