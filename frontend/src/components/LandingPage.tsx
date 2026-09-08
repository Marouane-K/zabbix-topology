import { ArrowRight, Mail, Zap, Shield, Activity, Globe, Server, Cpu, HardDrive } from "lucide-react";

const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const LinkedinIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export default function LandingPage({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-content">
          <div className="landing-header">
            <div className="version-badge">
              <Zap size={14} />
              <span>Version Test v1.0</span>
            </div>
            <div className="logo-icon">
              <img src="/logo.jpg" alt="TRANSMAP Zabbix Topology Logo" className="logo-image logo-transparent" />
            </div>
            <h1 className="landing-title">TRANSMAP Zabbix Topology</h1>
            <p className="landing-subtitle">
              Visualisation intelligente de topologie réseau basée sur Zabbix
            </p>
            <p className="landing-description">
              Transformez vos données Zabbix en une carte réseau interactive et dynamique. 
              Détectez automatiquement les interconnexions, surveillez les métriques en temps réel 
              et identifiez rapidement les goulots d'étranglement de votre infrastructure.
            </p>
          </div>

          <div className="landing-features">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Globe size={32} />
              </div>
              <h3>Détection automatique</h3>
              <p>Liaisons détectées via LLDP/CDP, IPs adjacentes (/30, /31, /29, /28) et sous-réseaux partagés</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Activity size={32} />
              </div>
              <h3>Métriques temps réel</h3>
              <p>CPU, RAM, Disque, trafic réseau avec indicateurs de saturation (vert/orange/rouge)</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Server size={32} />
              </div>
              <h3>Bande passante</h3>
              <p>Affichage du trafic entrant/sortant sur les liaisons avec pourcentage d'utilisation</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Cpu size={32} />
              </div>
              <h3>Graphiques d'historique</h3>
              <p>Évolution temporelle des métriques sur la dernière heure pour l'analyse de tendances</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Shield size={32} />
              </div>
              <h3>Métriques ICMP</h3>
              <p>Latence et perte de paquets pour évaluer la connectivité entre équipements</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <HardDrive size={32} />
              </div>
              <h3>Portabilité universelle</h3>
              <p>Compatible avec toutes les versions Zabbix (5.4+, 6.x, 7.x) et tous types d'équipements</p>
            </div>
          </div>

          <div className="landing-status">
            <div className="status-indicator">
              <div className="status-dot" />
              <span>Application en cours de développement</span>
            </div>
            <p className="status-text">
              Cette version de test est destinée à l'évaluation des fonctionnalités. 
              Des améliorations sont prévues pour les futures versions.
            </p>
          </div>

          <button className="landing-cta" onClick={onContinue}>
            <span>Commencer l'expérience</span>
            <ArrowRight size={20} />
          </button>

          <div className="landing-footer">
            <div className="developer-info">
              <span>Développé par </span>
              <strong>Marouane KRIR</strong>
            </div>
            <div className="social-links">
              <a
                href="https://github.com/Marouane-K/zabbix-topology"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                title="GitHub Repository"
              >
                <GithubIcon size={18} />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/marouane-krir/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                title="LinkedIn Profile"
              >
                <LinkedinIcon size={18} />
                <span>LinkedIn</span>
              </a>
              <a
                href="mailto:contact@example.com"
                className="social-link"
                title="Contact"
              >
                <Mail size={18} />
                <span>Contact</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
