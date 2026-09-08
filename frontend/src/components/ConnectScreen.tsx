import { useState, type FormEvent } from "react";
import { Cable, KeyRound, Link2, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "../api";

interface Props {
  onConnected: (sessionId: string, version: string) => void;
}

export function ConnectScreen({ onConnected }: Props) {
  const [url, setUrl] = useState("");
  const [authMethod, setAuthMethod] = useState<"password" | "token">("password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [verifySsl, setVerifySsl] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.connect({
        url,
        auth_method: authMethod,
        username: authMethod === "password" ? username : undefined,
        password: authMethod === "password" ? password : undefined,
        token: authMethod === "token" ? token : undefined,
        verify_ssl: verifySsl,
      });
      onConnected(res.session_id, res.zabbix_version);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.demo();
      onConnected(res.session_id, res.zabbix_version);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du mode démo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="connect-screen">
      <div className="connect-backdrop" aria-hidden />
      <div className="connect-card">
        <div className="connect-hero">
          <div className="connect-mark">
            <Cable size={28} />
          </div>
          <h1>Zabbix Topology</h1>
          <p>
            Visualisation intelligente de votre infrastructure supervisée — topologie interactive,
            états en direct, bande passante et problèmes actifs.
          </p>
        </div>

        <form className="connect-form" onSubmit={handleSubmit}>
          <label>
            URL de l’API Zabbix
            <div className="input-with-icon">
              <Link2 size={16} />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://zabbix.exemple.com/api_jsonrpc.php"
                required
              />
            </div>
          </label>

          <div className="auth-toggle">
            <button
              type="button"
              className={authMethod === "password" ? "active" : ""}
              onClick={() => setAuthMethod("password")}
            >
              Identifiants
            </button>
            <button
              type="button"
              className={authMethod === "token" ? "active" : ""}
              onClick={() => setAuthMethod("token")}
            >
              Token API
            </button>
          </div>

          {authMethod === "password" ? (
            <>
              <label>
                Utilisateur
                <input value={username} onChange={(e) => setUsername(e.target.value)} required />
              </label>
              <label>
                Mot de passe
                <div className="input-with-icon">
                  <KeyRound size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </label>
            </>
          ) : (
            <label>
              Token API
              <div className="input-with-icon">
                <ShieldCheck size={16} />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
            </label>
          )}

          <label className="checkbox">
            <input type="checkbox" checked={verifySsl} onChange={(e) => setVerifySsl(e.target.checked)} />
            Vérifier le certificat SSL
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary wide" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Tester et se connecter"}
          </button>
        </form>

        <div className="connect-divider">
          <span>ou</span>
        </div>

        <button className="demo-btn" type="button" onClick={handleDemo} disabled={loading}>
          <Sparkles size={16} />
          Explorer le mode démonstration
        </button>

        <p className="connect-hint">
          Les identifiants restent côté serveur — jamais exposés dans le navigateur au-delà de la
          requête de connexion.
        </p>
      </div>
    </div>
  );
}
