"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { compressAndUploadImage } from "@/lib/cloudinary";
import { CATEGORIES } from "@/lib/constants";
import { Business, PromoBanner, SiteSettings } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  Upload,
  Loader2,
  LogOut,
  Flame,
  Image as ImageIcon,
  Store,
  Save,
} from "lucide-react";

const MASTER_EMAILS = ["caldasonline10@gmail.com"];

export default function MasterAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [email, setEmail] = useState("caldasonline10@gmail.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Abas do Painel Master
  const [activeTab, setActiveTab] = useState<"empresas" | "banners" | "vip">("empresas");

  // Estados de Dados
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    vipGroupUrl: "https://chat.whatsapp.com/",
    vipGroupTitle: "Grupo VIP Caldas Online",
    vipGroupSubtitle: "Receba cupons secretos em primeira mão!",
    masterWhatsApp: "5564981005505",
  });

  // Novo Banner
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerPlacement, setBannerPlacement] = useState("home");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerOrder, setBannerOrder] = useState(1);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && MASTER_EMAILS.includes(currentUser.email || "")) {
        await loadAllMasterData();
      }
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  async function loadAllMasterData() {
    try {
      const snapBiz = await getDocs(collection(db, "businesses"));
      setBusinesses(
        snapBiz.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Business, "id">) }))
      );

      const snapBan = await getDocs(collection(db, "banners"));
      setBanners(
        snapBan.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<PromoBanner, "id">) }))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      );

      const snapSet = await getDoc(doc(db, "settings", "global"));
      if (snapSet.exists()) {
        setSettings((prev) => ({ ...prev, ...(snapSet.data() as Partial<SiteSettings>) }));
      }
    } catch (err) {
      console.error("Erro ao carregar dados Master:", err);
    }
  }

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!MASTER_EMAILS.includes(cred.user.email || "")) {
        await signOut(auth);
        setLoginError("Esta conta não possui permissão de Administrador Master.");
      }
    } catch {
      setLoginError("E-mail ou senha inválidos.");
    } finally {
      setLoggingIn(false);
    }
  };

  // Ações nas Empresas
  const toggleFeatured = async (biz: Business) => {
    await updateDoc(doc(db, "businesses", biz.id), { isFeatured: !biz.isFeatured });
    setBusinesses((prev) =>
      prev.map((item) =>
        item.id === biz.id ? { ...item, isFeatured: !item.isFeatured } : item
      )
    );
  };

  const toggleApproved = async (biz: Business) => {
    await updateDoc(doc(db, "businesses", biz.id), { isApproved: !biz.isApproved });
    setBusinesses((prev) =>
      prev.map((item) =>
        item.id === biz.id ? { ...item, isApproved: !item.isApproved } : item
      )
    );
  };

  const handleDeleteBusiness = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
    await deleteDoc(doc(db, "businesses", id));
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
  };

  // Ações nos Banners
  const handleUploadBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await compressAndUploadImage(file);
      setBannerImageUrl(url);
    } catch {
      alert("Erro ao enviar imagem do banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImageUrl) {
      alert("Envie a imagem do banner primeiro.");
      return;
    }
    const newBanner = {
      title: bannerTitle.trim() || "Banner Promocional",
      imageUrl: bannerImageUrl,
      linkUrl: bannerLink.trim(),
      placement: bannerPlacement,
      active: true,
      order: Number(bannerOrder) || 1,
    };
    const docRef = await addDoc(collection(db, "banners"), newBanner);
    setBanners((prev) => [...prev, { id: docRef.id, ...newBanner }]);
    setBannerTitle("");
    setBannerLink("");
    setBannerImageUrl("");
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Remover este banner?")) return;
    await deleteDoc(doc(db, "banners", id));
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  // Salvar Configurações VIP
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings, { merge: true });
      alert("Configurações do Grupo VIP e WhatsApp atualizadas!");
    } catch {
      alert("Erro ao salvar configurações.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A4D9C]" />
      </div>
    );
  }

  const isAuthorized = user && MASTER_EMAILS.includes(user.email || "");

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 max-w-md w-full p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-[#FFB800] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Acesso Master</h1>
            <p className="text-sm text-slate-500 mt-1">
              Painel administrativo exclusivo do Caldas Online.
            </p>

            <form onSubmit={handleMasterLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Master
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              {loginError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                Entrar no Painel Master
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* Cabeçalho Master */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFB800] text-slate-950 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black">Painel Master • Caldas Online</h1>
              <p className="text-xs text-slate-300">
                Gerencie empresas destacadas, banners pagos e o Grupo VIP
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut(auth)}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>

        {/* Navegação por Abas */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("empresas")}
            className={`inline-flex items-center gap-2 text-xs font-extrabold px-4 py-3 rounded-xl transition ${
              activeTab === "empresas"
                ? "bg-[#0A4D9C] text-white shadow"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <Store className="w-4 h-4" /> Empresas ({businesses.length})
          </button>

          <button
            onClick={() => setActiveTab("banners")}
            className={`inline-flex items-center gap-2 text-xs font-extrabold px-4 py-3 rounded-xl transition ${
              activeTab === "banners"
                ? "bg-[#0A4D9C] text-white shadow"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Banners Promocionais ({banners.length})
          </button>

          <button
            onClick={() => setActiveTab("vip")}
            className={`inline-flex items-center gap-2 text-xs font-extrabold px-4 py-3 rounded-xl transition ${
              activeTab === "vip"
                ? "bg-[#0A4D9C] text-white shadow"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500" /> Grupo VIP & Contato
          </button>
        </div>

        {/* ABA 1: EMPRESAS */}
        {activeTab === "empresas" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-extrabold text-slate-900">Empresas Cadastradas</h2>
            {businesses.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma empresa cadastrada ainda.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {businesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{biz.name}</span>
                        {biz.isFeatured && (
                          <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            DESTAQUE PAGO
                          </span>
                        )}
                        {biz.coupon?.active && (
                          <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            CUPOM ATIVO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Segmento: {biz.category} • Bairro: {biz.neighborhood} • Views:{" "}
                        {biz.viewsCount || 0} • Cliques WhatsApp: {biz.whatsappClicks || 0}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => toggleFeatured(biz)}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition ${
                          biz.isFeatured
                            ? "bg-[#FFB800] text-slate-950"
                            : "bg-slate-100 text-slate-700 hover:bg-amber-50"
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                        {biz.isFeatured ? "Remover Destaque" : "Destacar"}
                      </button>

                      <button
                        onClick={() => toggleApproved(biz)}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition ${
                          biz.isApproved
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {biz.isApproved ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Ativa
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Pausada
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteBusiness(biz.id, biz.name)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                        title="Excluir empresa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: BANNERS PROMOCIONAIS */}
        {activeTab === "banners" && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateBanner}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4"
            >
              <h2 className="font-extrabold text-slate-900">Cadastrar Novo Banner Pago</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cliente / Título do Banner
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Ex: Hotel Águas do Sol"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Onde vai aparecer?
                  </label>
                  <select
                    value={bannerPlacement}
                    onChange={(e) => setBannerPlacement(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                  >
                    <option value="home">Página Inicial (Home Principal)</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        Topo do Segmento: {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link ao clicar (Empresa ou WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="https://wa.me/5564... ou /empresa/..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-3 rounded-xl cursor-pointer">
                    {uploadingBanner ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {bannerImageUrl ? "Trocar Arte do Banner" : "Enviar Arte (1200x400px)"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadBannerFile}
                      className="hidden"
                    />
                  </label>

                  {bannerImageUrl && (
                    <img
                      src={bannerImageUrl}
                      alt="Preview"
                      className="h-12 w-32 object-cover rounded-lg border"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploadingBanner}
                  className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Publicar Banner
                </button>
              </div>
            </form>

            {/* Lista de Banners Ativos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {banners.map((ban) => (
                <div
                  key={ban.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
                >
                  <img
                    src={ban.imageUrl}
                    alt={ban.title}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{ban.title}</p>
                      <p className="text-xs text-slate-500">
                        Local: <span className="font-bold uppercase">{ban.placement}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteBanner(ban.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: GRUPO VIP & WHATSAPP MASTER */}
        {activeTab === "vip" && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4 max-w-2xl"
          >
            <h2 className="font-extrabold text-slate-900">
              Configurações do Grupo VIP e Vendas de Anúncios
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link de Convite do Grupo VIP (WhatsApp)
              </label>
              <input
                type="url"
                required
                value={settings.vipGroupUrl}
                onChange={(e) => setSettings({ ...settings, vipGroupUrl: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Seu WhatsApp Comercial (para empresas comprarem banners)
              </label>
              <input
                type="text"
                required
                value={settings.masterWhatsApp}
                onChange={(e) => setSettings({ ...settings, masterWhatsApp: e.target.value })}
                placeholder="5564981005505"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Configurações
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
