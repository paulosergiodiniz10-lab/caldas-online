"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { compressAndUploadImage } from "@/lib/cloudinary";
import { DEFAULT_CATEGORIES, DEFAULT_SITE_SETTINGS } from "@/lib/constants";
import { Business, CategoryDoc, SiteSettings } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  LogOut,
  Loader2,
  CheckCircle2,
  Ban,
  Trash2,
  ExternalLink,
  Search,
  Star,
  Plus,
  Upload,
  Save,
  Building2,
  Clock,
  Image as ImageIcon,
  Youtube,
  Settings,
  Tag,
} from "lucide-react";

const MASTER_EMAIL = "caldasonline10@gmail.com";

export default function MasterAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  const [activeTab, setActiveTab] = useState<"businesses" | "categories" | "settings">(
    "businesses"
  );

  // Empresas
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Categorias
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [newCatName, setNewCatName] = useState("");

  // Configurações Globais
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (
        currentUser &&
        (currentUser.email || "").toLowerCase() === MASTER_EMAIL
      ) {
        setUser(currentUser);
        await loadAllMasterData();
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  async function loadAllMasterData() {
    setLoadingData(true);
    try {
      // 1. Empresas
      const snapBiz = await getDocs(collection(db, "businesses"));
      const bizList = snapBiz.docs.map((d) => ({
        ...(d.data() as Omit<Business, "id">),
        id: d.id,
      }));
      // Ordena: Pendentes primeiro, depois mais recentes
      bizList.sort((a, b) => {
        const aPending = a.isApproved === false ? 0 : 1;
        const bPending = b.isApproved === false ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      setBusinesses(bizList);

      // 2. Categorias
      const snapCats = await getDocs(collection(db, "categories"));
      if (!snapCats.empty) {
        const catList = snapCats.docs
          .map((d) => ({ ...(d.data() as Omit<CategoryDoc, "id">), id: d.id }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategories(catList);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      // 3. Configurações Globais
      const snapSet = await getDoc(doc(db, "settings", "global"));
      if (snapSet.exists()) {
        setSettings((prev) => ({
          ...prev,
          ...(snapSet.data() as Partial<SiteSettings>),
        }));
      }
    } catch (err) {
      console.error("Erro ao carregar dados Master:", err);
    } finally {
      setLoadingData(false);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSubmittingAuth(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if ((cred.user.email || "").toLowerCase() !== MASTER_EMAIL) {
        await signOut(auth);
        setAuthError("Acesso restrito: este e-mail não possui permissão Master.");
      }
    } catch {
      setAuthError("E-mail ou senha inválidos.");
    } finally {
      setSubmittingAuth(false);
    }
  };

  // AÇÕES DE MODERAÇÃO (LIBERAR / BLOQUEAR / EXCLUIR) COM ALERTA
  const handleApproveBusiness = async (biz: Business) => {
    const confirmed = window.confirm(
      `✅ LIBERAR EMPRESA?\n\nDeseja aprovar e publicar "${biz.name}" imediatamente no guia Caldas Online?`
    );
    if (!confirmed) return;

    setUpdatingId(biz.id);
    try {
      await updateDoc(doc(db, "businesses", biz.id), {
        isApproved: true,
        approvedAt: Date.now(),
      });
      setBusinesses((prev) =>
        prev.map((item) =>
          item.id === biz.id ? { ...item, isApproved: true } : item
        )
      );
      alert(`"${biz.name}" foi liberada e já está visível no site!`);
    } catch (err) {
      console.error(err);
      alert("Erro ao liberar empresa.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBlockBusiness = async (biz: Business) => {
    const confirmed = window.confirm(
      `⚠️ BLOQUEAR EMPRESA?\n\nTem certeza que deseja bloquear "${biz.name}"? A página sairá do ar imediatamente para o público.`
    );
    if (!confirmed) return;

    setUpdatingId(biz.id);
    try {
      await updateDoc(doc(db, "businesses", biz.id), {
        isApproved: false,
      });
      setBusinesses((prev) =>
        prev.map((item) =>
          item.id === biz.id ? { ...item, isApproved: false } : item
        )
      );
      alert(`"${biz.name}" foi bloqueada e retirada do ar.`);
    } catch (err) {
      console.error(err);
      alert("Erro ao bloquear empresa.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteBusiness = async (biz: Business) => {
    const confirmed = window.confirm(
      `🚨 EXCLUIR DEFINITIVAMENTE?\n\nAtenção: Esta ação apaga "${biz.name}" permanentemente do guia Caldas Online e NÃO pode ser desfeita.\n\nDeseja realmente excluir?`
    );
    if (!confirmed) return;

    setUpdatingId(biz.id);
    try {
      await deleteDoc(doc(db, "businesses", biz.id));
      setBusinesses((prev) => prev.filter((item) => item.id !== biz.id));
      alert(`"${biz.name}" foi excluída definitivamente.`);
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir empresa.");
    } finally {
      setUpdatingId(null);
    }
  };

  // CONTROLE DE PLANO (FOTOS, VÍDEOS, DESTAQUE)
  const handleUpdatePlan = async (
    biz: Business,
    updates: Partial<Business>
  ) => {
    setUpdatingId(biz.id);
    try {
      await updateDoc(doc(db, "businesses", biz.id), updates);
      setBusinesses((prev) =>
        prev.map((item) => (item.id === biz.id ? { ...item, ...updates } : item))
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar plano da empresa.");
    } finally {
      setUpdatingId(null);
    }
  };

  // CATEGORIAS
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const slug = newCatName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const payload: CategoryDoc = {
      id: slug,
      name: newCatName.trim(),
      slug,
      order: categories.length + 1,
      active: true,
    };

    try {
      await setDoc(doc(db, "categories", slug), payload);
      setCategories((prev) => [...prev, payload]);
      setNewCatName("");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar categoria.");
    }
  };

  const handleToggleCategory = async (cat: CategoryDoc) => {
    const nextActive = cat.active === false;
    try {
      await setDoc(
        doc(db, "categories", cat.id),
        { ...cat, active: nextActive },
        { merge: true }
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, active: nextActive } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // CONFIGURAÇÕES GLOBAIS
  const handleUploadHeroBanner = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await compressAndUploadImage(file);
      setSettings((prev) => ({ ...prev, heroBannerUrl: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar banner.");
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings, { merge: true });
      alert("✅ Configurações globais salvas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A4D9C]" />
      </div>
    );
  }

  // TELA DE LOGIN MASTER
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar vipGroupUrl={settings.vipGroupUrl} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 max-w-md w-full p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-[#FFB800] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Painel Master</h1>
            <p className="text-sm text-slate-500 mt-1">
              Acesso exclusivo para moderação, planos e gestão do Caldas Online.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Administrativo
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="caldasonline10@gmail.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              {authError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingAuth}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {submittingAuth && <Loader2 className="w-4 h-4 animate-spin" />}
                Entrar no Painel Master
              </button>
            </form>
          </div>
        </main>
        <Footer settings={settings} />
      </div>
    );
  }

  const pendingCount = businesses.filter((b) => b.isApproved === false).length;

  const filteredBusinesses = businesses.filter((biz) => {
    const matchesSearch =
      biz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (biz.neighborhood || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (biz.category || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "pending") return biz.isApproved === false;
    if (statusFilter === "approved") return biz.isApproved !== false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        vipGroupUrl={settings.vipGroupUrl}
        masterWhatsApp={settings.masterWhatsApp}
      />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* TOPO MASTER */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7A00] text-slate-950 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black">
                Administração Master • Caldas Online
              </h1>
              <p className="text-xs text-slate-300">
                {businesses.length} empresa(s) cadastradas •{" "}
                <strong className="text-[#FFB800]">
                  {pendingCount} aguardando liberação
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut(auth)}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" /> Sair do Master
          </button>
        </div>

        {/* ABAS DE NAVEGAÇÃO */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("businesses")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              activeTab === "businesses"
                ? "bg-[#0A4D9C] text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Empresas & Moderação
            {pendingCount > 0 && (
              <span className="bg-[#FF7A00] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              activeTab === "categories"
                ? "bg-[#0A4D9C] text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Tag className="w-4 h-4" />
            Categorias
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#0A4D9C] text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-4 h-4" />
            Banners & WhatsApp Master
          </button>
        </div>

        {/* ABA 1: EMPRESAS & MODERAÇÃO */}
        {activeTab === "businesses" && (
          <div className="space-y-4">
            {/* Barra de Busca e Filtros de Status */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar empresa por nome, bairro ou categoria..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Todas ({businesses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    statusFilter === "pending"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  ⏳ Aguardando Liberação ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("approved")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    statusFilter === "approved"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  ✅ Liberadas ({businesses.length - pendingCount})
                </button>
              </div>
            </div>

            {loadingData ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0A4D9C]" />
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-sm text-slate-500 border border-slate-100">
                Nenhuma empresa encontrada neste filtro.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBusinesses.map((biz) => {
                  const isPending = biz.isApproved === false;
                  const isBusy = updatingId === biz.id;

                  return (
                    <div
                      key={biz.id}
                      className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition space-y-4 ${
                        isPending
                          ? "border-amber-400 bg-amber-50/20"
                          : "border-slate-100"
                      }`}
                    >
                      {/* TARJA SUPERIOR DE STATUS */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                              <Clock className="w-3.5 h-3.5" />
                              AGUARDANDO LIBERAÇÃO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              PUBLICADA NO SITE
                            </span>
                          )}

                          {biz.isFeatured && (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-[#0A4D9C] text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                              <Star className="w-3 h-3 fill-[#0A4D9C]" /> Patrocinada
                            </span>
                          )}
                        </div>

                        {/* BOTÃO VISTORIAR PÁGINA */}
                        <Link
                          href={`/empresa/${biz.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#0A4D9C] font-extrabold text-xs px-3.5 py-2 rounded-xl transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Vistoriar Página
                        </Link>
                      </div>

                      {/* DADOS DA EMPRESA + CONTROLES DE PLANO */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {biz.logoUrl ? (
                            <img
                              src={biz.logoUrl}
                              alt={biz.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                              <Building2 className="w-6 h-6" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <h3 className="text-base sm:text-lg font-black text-slate-900">
                              {biz.name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Categoria: <strong>{biz.category}</strong> • Bairro:{" "}
                              <strong>{biz.neighborhood || "Não informado"}</strong>
                            </p>
                            <p className="text-xs text-slate-500">
                              WhatsApp: <strong>{biz.whatsapp || "Não informado"}</strong> •{" "}
                              Visitas: <strong>{biz.viewsCount || 0}</strong> • Cliques WA:{" "}
                              <strong>{biz.whatsappClicks || 0}</strong>
                            </p>
                          </div>
                        </div>

                        {/* CONTROLES DE PLANO (FOTOS, VÍDEOS, DESTAQUE) */}
                        <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <ImageIcon className="w-3.5 h-3.5 text-[#0A4D9C]" />
                            Fotos:
                            <select
                              value={biz.maxPhotos ?? 6}
                              disabled={isBusy}
                              onChange={(e) =>
                                handleUpdatePlan(biz, {
                                  maxPhotos: Number(e.target.value),
                                })
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white font-extrabold"
                            >
                              <option value={6}>6 (Grátis)</option>
                              <option value={12}>12 fotos</option>
                              <option value={20}>20 fotos</option>
                              <option value={30}>30 fotos</option>
                            </select>
                          </label>

                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Youtube className="w-3.5 h-3.5 text-red-600" />
                            Vídeos:
                            <select
                              value={biz.maxVideos ?? 0}
                              disabled={isBusy}
                              onChange={(e) =>
                                handleUpdatePlan(biz, {
                                  maxVideos: Number(e.target.value),
                                })
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white font-extrabold"
                            >
                              <option value={0}>0 (Grátis)</option>
                              <option value={1}>1 (Horizontal)</option>
                              <option value={2}>2 (1H + 1V)</option>
                              <option value={3}>3 (1H + 2V)</option>
                              <option value={4}>4 (1H + 3V)</option>
                            </select>
                          </label>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleUpdatePlan(biz, {
                                isFeatured: !biz.isFeatured,
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1 transition cursor-pointer ${
                              biz.isFeatured
                                ? "bg-[#FFB800] text-slate-950"
                                : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" />
                            {biz.isFeatured ? "Em Destaque" : "Destacar"}
                          </button>
                        </div>
                      </div>

                      {/* BOTÕES DE MODERAÇÃO: LIBERAR | BLOQUEAR | EXCLUIR */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                        <button
                          type="button"
                          disabled={isBusy || !isPending}
                          onClick={() => handleApproveBusiness(biz)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition ${
                            isPending
                              ? "bg-[#1DB954] hover:bg-[#18a349] text-white shadow-sm cursor-pointer"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Liberar Empresa
                        </button>

                        <button
                          type="button"
                          disabled={isBusy || isPending}
                          onClick={() => handleBlockBusiness(biz)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition ${
                            !isPending
                              ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm cursor-pointer"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <Ban className="w-4 h-4" />
                          Bloquear
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeleteBusiness(biz)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: CATEGORIAS */}
        {activeTab === "categories" && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5">
            <h2 className="text-lg font-black text-slate-900">
              Gerenciar Categorias do Guia
            </h2>

            <form
              onSubmit={handleAddCategory}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nome da nova categoria (ex: Pet Shop)"
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-5 py-3 rounded-xl inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                    <p className="text-[11px] text-slate-400">Slug: {cat.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold ${
                      cat.active !== false
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cat.active !== false ? "Ativa" : "Oculta"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: CONFIGURAÇÕES GLOBAIS E BANNERS */}
        {activeTab === "settings" && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5"
          >
            <h2 className="text-lg font-black text-slate-900">
              Banners, Grupo VIP e WhatsApp Master
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Master (com DDI 55 e DDD)
                </label>
                <input
                  type="text"
                  value={settings.masterWhatsApp || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, masterWhatsApp: e.target.value })
                  }
                  placeholder="5564981005505"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link do Grupo VIP de Ofertas (WhatsApp)
                </label>
                <input
                  type="url"
                  value={settings.vipGroupUrl || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, vipGroupUrl: e.target.value })
                  }
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Banner Principal da Home (Opcional)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">
                    {uploadingBanner ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Enviar Novo Banner
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadHeroBanner}
                      className="hidden"
                    />
                  </label>
                  {settings.heroBannerUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({ ...settings, heroBannerUrl: "" })
                      }
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Remover Banner
                    </button>
                  )}
                </div>
                {settings.heroBannerUrl && (
                  <img
                    src={settings.heroBannerUrl}
                    alt="Banner Principal"
                    className="w-full max-h-48 object-cover rounded-2xl border border-slate-200 mt-2"
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-sm px-6 py-3.5 rounded-xl inline-flex items-center gap-2"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Configurações Globais
            </button>
          </form>
        )}
      </main>

      <Footer settings={settings} />
    </div>
  );
}
