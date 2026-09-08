# 🌐 TRANSMAP Zabbix Topology

**Application web de visualisation intelligente de topologie réseau basée sur l'API Zabbix**

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-green?logo=python)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)

---

## 🚀 Installation rapide (Recommandée)

### Méthode 1 : Script d'installation automatique ⚡

**La méthode la plus simple pour démarrer rapidement.**

#### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (obligatoire)
- [Git](https://git-scm.com/download/win) (obligatoire)

#### Étapes

1. **Télécharger le fichier d'installation**
   - Allez sur : https://github.com/Marouane-K/zabbix-topology
   - Téléchargez le fichier `TRANSMAP_Installer.bat`

2. **Double-cliquer sur `TRANSMAP_Installer.bat`**
   - Le script vérifie Docker et Git
   - Clone automatiquement le dépôt
   - Construit et lance l'application

3. **Accéder à l'application**
   - Ouvrez votre navigateur sur : http://localhost

#### Arrêter l'application
- Appuyez sur `Ctrl+C` dans la fenêtre du script
- Ou exécutez : `docker-compose down` dans le dossier `zabbix-topology`

---

### Méthode 2 : Docker Compose 🐳

**Pour les utilisateurs familiarisés avec Docker.**

#### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/download/win)

#### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/Marouane-K/zabbix-topology.git
cd zabbix-topology

# 2. Lancer l'application
docker-compose up --build

# 3. Accéder à l'application
# Frontend : http://localhost
# Backend API : http://localhost:8000
```

#### Arrêter l'application
```bash
docker-compose down
```

---

## 📋 Installation manuelle (Sans Docker)

**À utiliser si Docker ne fonctionne pas sur votre machine.**

### Prérequis
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- npm (inclus avec Node.js)

### Étapes d'installation

#### 1. Cloner le dépôt
```bash
git clone https://github.com/Marouane-K/zabbix-topology.git
cd zabbix-topology
```

#### 2. Installer le Backend (Python)

**Windows PowerShell** :
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Linux/Mac** :
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 3. Installer le Frontend (Node.js)

**Ouvrir un nouveau terminal** et laisser le backend tourner dans le premier.

**Windows PowerShell** :
```powershell
cd frontend
npm install
npm run dev
```

**Linux/Mac** :
```bash
cd frontend
npm install
npm run dev
```

#### 4. Accéder à l'application
- Ouvrez votre navigateur sur : http://localhost:5173

### Arrêter l'application
- Appuyez sur `Ctrl+C` dans les deux terminaux (backend et frontend)

---

## 🔑 Connexion à Zabbix

### Première utilisation

1. **Arrivez sur la landing page** "TRANSMAP Zabbix Topology"
2. **Cliquez sur "Commencer l'expérience"**
3. **Entrez vos informations Zabbix** :
   - URL de l'API Zabbix (ex: `http://192.168.1.100/api_jsonrpc.php`)
   - Choisissez **Identifiants** ou **Token API**
   - Cochez/décochez "Vérifier le certificat SSL" selon votre configuration

4. **Cliquez sur "Tester et se connecter"**

### Sans instance Zabbix ?

Utilisez le bouton **"Explorer le mode démonstration"** pour découvrir l'interface sans Zabbix.

---

## 📊 Fonctionnalités

### Détection automatique
- Liaisons détectées via **LLDP/CDP**
- IPs adjacentes (/30, /31, /29, /28)
- Sous-réseaux partagés
- Cartes Zabbix

### Métriques temps réel
- **CPU**, **RAM**, **Disque**
- Trafic réseau (entrant/sortant)
- Indicateurs de saturation (vert/orange/rouge)
- Latence ICMP et perte de paquets

### Visualisation
- Topologie interactive (zoom, pan, drag)
- Layout automatique avec ELK.js
- Graphiques d'historique (dernière heure)
- Mode simple / supervision / détaillé
- Sauvegarde et restauration des positions

### Compatibilité
- Zabbix 5.4+, 6.x, 7.x
- Tous types d'équipements (Cisco, HP, Juniper, etc.)

---

## 🛡️ Sécurité

- Les identifiants Zabbix transitent vers le backend puis une session serveur est utilisée
- Ne committez jamais `.env` ni de tokens
- Les secrets ne sont jamais stockés dans le frontend

---

## 👨‍💻 Développeur

**Développé par Marouane KRIR**

- 📦 GitHub : https://github.com/Marouane-K/zabbix-topology
- 💼 LinkedIn : https://www.linkedin.com/in/marouane-krir/
- 📧 Contact : [via LinkedIn]

---

## ⚠️ Note

Cette application est en **version de test v1.0**. Des améliorations sont prévues pour les futures versions.

---
