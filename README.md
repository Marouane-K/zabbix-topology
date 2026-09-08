# TRANSMAP Zabbix Topology

Application web de **visualisation intelligente de topologie réseau** basée sur l’API Zabbix.

## 🚀 Démarrage rapide avec Docker (Recommandé)

### Prérequis
- Docker Desktop installé sur votre machine

### Installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/Marouane-K/zabbix-topology.git
cd zabbix-topology
```

2. **Lancer l'application**
```bash
docker-compose up --build
```

3. **Accéder à l'application**
- Frontend : http://localhost
- Backend API : http://localhost:8000

### Arrêter l'application
```bash
docker-compose down
```

---

## 📋 Installation manuelle (Sans Docker)

### Prérequis
- Python 3.10+
- Node.js 18+
- npm

```text
Zabbix (JSON-RPC)
        ↓
FastAPI (Python) — auth, inventaire, topologie, layouts
        ↓
React + React Flow + ELK.js — topologie interactive
```

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Ouvrir : http://localhost:5173

## Connexion Zabbix

Sur l’écran d’accueil :

1. Renseigner l’URL de l’API (ex. `http://IP-ZABBIX/api_jsonrpc.php`)
2. Choisir **Identifiants** ou **Token API**
3. Tester la connexion

Sans instance Zabbix sous la main : utiliser **Explorer le mode démonstration**.

### Informations à fournir (quand vous connecterez votre labo)

| Champ | Exemple | Où le trouver |
|-------|---------|----------------|
| URL API | `http://192.168.x.x/api_jsonrpc.php` | Interface Zabbix / doc appliance |
| Utilisateur | `Admin` ou compte lecture | Administration → Users |
| Mot de passe | — | — |
| Token API (recommandé) | token long | User settings → API tokens (Zabbix ≥ 5.4) |
| SSL | cocher/décocher | Décocher si certificat auto-signé en labo |

Vous pouvez me les envoyer dans le chat (sans coller de vrai mot de passe de production) ou les saisir uniquement dans l’UI.

## Fonctionnalités (v0.1)

- Connexion sécurisée via backend (secrets non stockés dans le frontend)
- Inventaire dynamique des hôtes (groupes, templates, interfaces, problèmes)
- Inférence de type d’équipement + icônes
- Topologie interactive (zoom, pan, drag, minimap, légende, filtres, recherche)
- Layout automatique ELK.js + **Réorganiser automatiquement**
- Sauvegarde / restauration des positions par `hostid`
- Modes d’affichage : simple / supervision / détaillé
- Panneau de détail équipement / liaison
- Mode démo riche pour présenter l’UI sans Zabbix
- Liens uniquement si justifiés (cartes Zabbix, neighbor/LLDP/CDP) — jamais inventés

## Sécurité

- Les identifiants Zabbix transitent vers le backend puis une session serveur est utilisée
- Ne committez jamais `.env` ni de tokens
