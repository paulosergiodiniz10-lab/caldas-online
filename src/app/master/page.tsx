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
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { compressAndUploadImage } from "@/lib/cloudinary";
import {
  ICON_OPTIONS,
  COLOR_OPTIONS,
  DEFAULT_CATEGORIES,
  DEFAULT_UTILITIES,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/constants";
import {
  Business,
  PromoBanner,
  SiteSettings,
  CategoryDoc,
  UtilityDoc,
} from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CategoryIcon } from "@/components/CategoryIcon";
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
  Image as ImageIcon,
  Store,
  Save,
  Pencil,
  Grid,
  PhoneCall,
  Type,
  AlertTriangle,
  X,
  Download,
} from "lucide-react";

const MASTER_EMAILS = ["caldasonline10@gmail.com"];

function createSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

interface ConfirmModalState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}

export default function MasterAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [email, setEmail] = useState("caldasonline10@gmail.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "empresas" | "categorias" | "utilidades" | "banners" | "textos"
  >("empresas");

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    open: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });
  const [deletingItem, setDeletingItem] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [utilities, setUtilities] = useState<UtilityDoc[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Form Categoria
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catSubtitle, setCatSubtitle] = useState("");
  const [catIconName, setCatIconName] = useState("Utensils");
  const [catCustomIconUrl, setCatCustomIconUrl] = useState("");
  const [catBgColor, setCatBgColor] = useState("bg-orange-500");
  const [catOrder, setCatOrder] = useState(1);
  const [uploadingCatIcon, setUploadingCatIcon] = useState(false);

  // Form Utilidade Rápida
  const [editingUtilId, setEditingUtilId] = useState<string | null>(null);
  const [utilName, setUtilName] = useState("");
  const [utilNumber, setUtilNumber] = useState("");
  const [utilColor, setUtilColor] = useState("bg-blue-900");
  const [utilIconName, setUtilIconName] = useState("PhoneCall");
  const [utilCustomIconUrl, setUtilCustomIconUrl] = useState("");
  const [utilOrder, setUtilOrder] = useState(1);
  const [uploadingUtilIcon, setUploadingUtilIcon] = useState(false);

  // Form Banner
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerPlacement, setBannerPlacement] = useState("home");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerOrder, setBannerOrder] = useState(1);
  const [bannerActive, setBannerActive] = useState(true);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Form Mais Procurados
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagQuery, setNewTagQuery] = useState("");
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

      const snapCats = await getDocs(collection(db, "categories"));
      setCategories(
        snapCats.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<CategoryDoc, "id">) }))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      );

      const snapUtils = await getDocs(collection(db, "utilities"));
      setUtilities(
        snapUtils.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<UtilityDoc, "id">) }))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
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

  const askConfirm = (title: string, message: string, onConfirm: () => Promise<void>) => {
    setConfirmModal({ open: true, title, message, onConfirm });
  };

  const executeConfirm = async () => {
    setDeletingItem(true);
    try {
      await confirmModal.onConfirm();
      setConfirmModal((prev) => ({ ...prev, open: false }));
    } finally {
      setDeletingItem(false);
    }
  };

  // ================= EMPRESAS =================
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

  const updateBusinessLimits = async (
    bizId: string,
    field: "maxPhotos" | "maxVideos",
    value: number
  ) => {
    const safeValue = Math.max(0, Number(value) || 0);
    await updateDoc(doc(db, "businesses", bizId), { [field]: safeValue });
    setBusinesses((prev) =>
      prev.map((item) =>
        item.id === bizId ? { ...item, [field]: safeValue } : item
      )
    );
  };

  // ================= CATEGORIAS =================
  const handleImportDefaultCategories = async () => {
    const batch = writeBatch(db);
    DEFAULT_CATEGORIES.forEach((cat) => {
      const ref = doc(db, "categories", cat.id);
      batch.set(ref, cat);
    });
    await batch.commit();
    await loadAllMasterData();
  };

  const handleUploadCategoryIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCatIcon(true);
    try {
      const url = await compressAndUploadImage(file);
      setCatCustomIconUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar ícone personalizado.");
    } finally {
      setUploadingCatIcon(false);
    }
  };

  const resetCategoryForm = () => {
    setEditingCatId(null);
    setCatName("");
    setCatSubtitle("");
    setCatIconName("Utensils");
    setCatCustomIconUrl("");
    setCatBgColor("bg-orange-500");
    setCatOrder(categories.length + 1);
  };

  const startEditCategory = (cat: CategoryDoc) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatSubtitle(cat.subtitle);
    setCatIconName(cat.iconName);
    setCatCustomIconUrl(cat.customIconUrl || "");
    setCatBgColor(cat.bgColor);
    setCatOrder(cat.order || 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = editingCatId || createSlug(catName);
    const payload: Omit<CategoryDoc, "id"> = {
      slug,
      name: catName.trim(),
      subtitle: catSubtitle.trim(),
      iconName: catIconName,
      customIconUrl: catCustomIconUrl.trim(),
      bgColor: catBgColor,
      order: Number(catOrder) || 1,
      active: true,
    };

    if (editingCatId) {
      await updateDoc(doc(db, "categories", editingCatId), payload);
    } else {
      await setDoc(doc(db, "categories", slug), payload);
    }
    resetCategoryForm();
    await loadAllMasterData();
  };

  // ================= UTILIDADES RÁPIDAS =================
  const handleImportDefaultUtilities = async () => {
    const batch = writeBatch(db);
    DEFAULT_UTILITIES.forEach((util) => {
      const ref = doc(db, "utilities", util.id);
      batch.set(ref, util);
    });
    await batch.commit();
    await loadAllMasterData();
  };

  const handleUploadUtilityIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingUtilIcon(true);
    try {
      const url = await compressAndUploadImage(file);
      setUtilCustomIconUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar ícone personalizado.");
    } finally {
      setUploadingUtilIcon(false);
    }
  };

  const resetUtilityForm = () => {
    setEditingUtilId(null);
    setUtilName("");
    setUtilNumber("");
    setUtilColor("bg-blue-900");
    setUtilIconName("PhoneCall");
    setUtilCustomIconUrl("");
    setUtilOrder(utilities.length + 1);
  };

  const startEditUtility = (util: UtilityDoc) => {
    setEditingUtilId(util.id);
    setUtilName(util.name);
    setUtilNumber(util.number);
    setUtilColor(util.color);
    setUtilIconName(util.iconName);
    setUtilCustomIconUrl(util.customIconUrl || "");
    setUtilOrder(util.order || 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveUtility = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<UtilityDoc, "id"> = {
      name: utilName.trim(),
      number: utilNumber.trim(),
      color: utilColor,
      iconName: utilIconName,
      customIconUrl: utilCustomIconUrl.trim(),
      order: Number(utilOrder) || 1,
      active: true,
    };

    if (editingUtilId) {
      await updateDoc(doc(db, "utilities", editingUtilId), payload);
    } else {
      await addDoc(collection(db, "utilities"), payload);
    }
    resetUtilityForm();
    await loadAllMasterData();
  };

  // ================= BANNERS =================
  const handleUploadBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await compressAndUploadImage(file);
      setBannerImageUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar imagem do banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerTitle("");
    setBannerPlacement("home");
    setBannerLink("");
    setBannerOrder(banners.length + 1);
    setBannerActive(true);
    setBannerImageUrl("");
  };

  const startEditBanner = (ban: PromoBanner) => {
    setEditingBannerId(ban.id);
    setBannerTitle(ban.title);
    setBannerPlacement(ban.placement);
    setBannerLink(ban.linkUrl);
    setBannerOrder(ban.order || 1);
    setBannerActive(ban.active);
    setBannerImageUrl(ban.imageUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImageUrl) {
      alert("Envie a arte do banner antes de salvar.");
      return;
    }
    const payload = {
      title: bannerTitle.trim() || "Banner Promocional",
      imageUrl: bannerImageUrl,
      linkUrl: bannerLink.trim(),
      placement: bannerPlacement,
      active: bannerActive,
      order: Number(bannerOrder) || 1,
    };

    if (editingBannerId) {
      await updateDoc(doc(db, "banners", editingBannerId), payload);
    } else {
      await addDoc(collection(db, "banners"), payload);
    }
    resetBannerForm();
    await loadAllMasterData();
  };

  // ================= TEXTOS & CONFIGURAÇÕES =================
  const handleAddSearchTag = () => {
    if (!newTagLabel.trim() || !newTagQuery.trim()) return;
    setSettings((prev) => ({
      ...prev,
      mostSearchedItems: [
        ...(prev.mostSearchedItems || []),
        { label: newTagLabel.trim(), query: newTagQuery.trim().toLowerCase() },
      ],
    }));
    setNewTagLabel("");
    setNewTagQuery("");
  };

  const handleRemoveSearchTag = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      mostSearchedItems: prev.mostSearchedItems.filter((_, i) => i !== index),
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings, { merge: true });
      alert("Todos os textos, botões e mensagens foram atualizados no portal!");
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
        <Footer settings={settings} />
      </div>
    );
  }

  const activeCategoryChoices =
    categories.length > 0 ? categories : DEFAULT_CATEGORIES;

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
                Controle total de empresas, limites de mídia, categorias, ícones, banners e textos
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
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab("empresas")}
            className={`inline-flex items-center gap-2 text-xs font-extrabold px-4 py-3 rounded-xl whitespace-nowrap transition ${
              activeTab === "empresas"
                ? "bg-[#0A4D9C] text-white shadow"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <Store className="w-4 h-4" /> Empresas ({businesses.length})
          </button>

          <button
            onClick={() => setActiveTab("categorias")}
            className={`inline-flex items-center gap-2 text-xs font-extrabold px-4 py-3 rounded-xl whitespace-nowrap transition ${
              activeTab === "categorias"
                ? "bg-[#0A4D9C] text-white shadow"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <Grid className="w-4 h-4" /> Categorias & Ícones ({categories.length})
          </button>

          <button
            onClick={() => setActiveTab("utilidades")}
            className={`inline-flex items-center gap-2 text-xs font-extrabold px-4 py-3 rounded-xl whitespace-nowrap transition ${
              activeTab === "utilidades"
                ? "bg-[#0A4D9C] text-white shadow"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <PhoneCall className="w-4 h-4" /> Utilidades Rápidas ({utilities.length})
          </button>

          <button
            onClick={() => setActiveTab("banners")}
            className={`inline-flex items-center gap-2 text-xs font-extrabold px-4 py-3 rounded-xl whitespace-nowrap transition ${
              activeTab === "banners"
                ? "bg-[#0A4D9C] text-white shadow"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Banners ({banners.length})
          </button>

          <button
            onClick={() => setActiveTab("textos")}
            className={`inline-flex items-center gap-2 text-xs font-extrabold px-4 py-3 rounded-xl whitespace-nowrap transition ${
              activeTab === "textos"
                ? "bg-[#0A4D9C] text-white shadow"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <Type className="w-4 h-4" /> Textos, Banners & VIP
          </button>
        </div>

        {/* ==================== ABA 1: EMPRESAS ==================== */}
        {activeTab === "empresas" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-extrabold text-slate-900">Empresas Cadastradas</h2>
              <p className="text-xs text-slate-500">
                Padrão grátis: <strong>5 fotos</strong> e <strong>1 vídeo</strong> (até 4 vídeos para planos pagos)
              </p>
            </div>

            {businesses.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma empresa cadastrada ainda.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {businesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
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
                        {biz.viewsCount || 0} • WhatsApp: {biz.whatsappClicks || 0}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Controle de Limite de Fotos */}
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-600">Fotos:</span>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          defaultValue={biz.maxPhotos ?? 5}
                          onBlur={(e) =>
                            updateBusinessLimits(biz.id, "maxPhotos", Number(e.target.value))
                          }
                          className="w-12 text-center text-xs font-extrabold bg-white border border-slate-300 rounded-lg py-1"
                          title="Limite de fotos liberadas para este cliente"
                        />
                      </div>

                      {/* Controle de Limite de Vídeos */}
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-600">Vídeos:</span>
                        <input
                          type="number"
                          min={0}
                          max={4}
                          defaultValue={biz.maxVideos ?? 1}
                          onBlur={(e) =>
                            updateBusinessLimits(
                              biz.id,
                              "maxVideos",
                              Math.min(4, Number(e.target.value))
                            )
                          }
                          className="w-11 text-center text-xs font-extrabold bg-white border border-slate-300 rounded-lg py-1"
                          title="Limite de vídeos do YouTube (1 = 1 horizontal; até 4 = 1 horizontal + 3 verticais)"
                        />
                      </div>

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
                        onClick={() =>
                          askConfirm(
                            "Excluir Empresa",
                            `Tem certeza que deseja excluir permanentemente "${biz.name}"?`,
                            async () => {
                              await deleteDoc(doc(db, "businesses", biz.id));
                              setBusinesses((prev) => prev.filter((b) => b.id !== biz.id));
                            }
                          )
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
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

        {/* ==================== ABA 2: CATEGORIAS & ÍCONES ==================== */}
        {activeTab === "categorias" && (
          <div className="space-y-6">
            {categories.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-[#0A4D9C]">
                    O site está exibindo as 10 categorias padrão.
                  </p>
                  <p className="text-xs text-slate-600">
                    Clique no botão ao lado para importar todas para o banco e poder editar ou excluir qualquer uma.
                  </p>
                </div>
                <button
                  onClick={handleImportDefaultCategories}
                  className="bg-[#0A4D9C] text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" /> Importar 10 Categorias Padrão
                </button>
              </div>
            )}

            <form
              onSubmit={handleSaveCategory}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-slate-900">
                  {editingCatId ? `Editando Categoria: ${catName}` : "Criar Nova Categoria"}
                </h2>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Ex: Pet Shop & Agro"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtítulo curto *
                  </label>
                  <input
                    type="text"
                    required
                    value={catSubtitle}
                    onChange={(e) => setCatSubtitle(e.target.value)}
                    placeholder="Ex: Clínicas vet, rações, banho e tosa..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ordem de exibição
                  </label>
                  <input
                    type="number"
                    value={catOrder}
                    onChange={(e) => setCatOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Cor do Quadrado
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setCatBgColor(c.value)}
                      className={`w-8 h-8 rounded-xl ${c.value} flex items-center justify-center transition ${
                        catBgColor === c.value
                          ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Escolha um Ícone (ou envie uma imagem PNG própria)
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer">
                    {uploadingCatIcon ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Subir Ícone PNG
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCategoryIcon}
                      className="hidden"
                    />
                  </label>
                </div>

                {catCustomIconUrl && (
                  <div className="mb-3 flex items-center gap-2 bg-blue-50 p-2 rounded-xl w-fit">
                    <img src={catCustomIconUrl} alt="" className="w-6 h-6 object-contain" />
                    <span className="text-xs font-bold text-[#0A4D9C]">
                      Ícone personalizado ativo
                    </span>
                    <button
                      type="button"
                      onClick={() => setCatCustomIconUrl("")}
                      className="text-red-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50">
                  {ICON_OPTIONS.map((ic) => (
                    <button
                      type="button"
                      key={ic.name}
                      onClick={() => {
                        setCatIconName(ic.name);
                        setCatCustomIconUrl("");
                      }}
                      title={ic.label}
                      className={`p-2.5 rounded-xl flex items-center justify-center transition ${
                        !catCustomIconUrl && catIconName === ic.name
                          ? `${catBgColor} text-white shadow`
                          : "bg-white text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <CategoryIcon name={ic.name} className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-5 py-3 rounded-xl inline-flex items-center gap-2"
              >
                {editingCatId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingCatId ? "Salvar Alterações da Categoria" : "Adicionar Categoria"}
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl ${cat.bgColor} flex items-center justify-center shrink-0`}
                    >
                      <CategoryIcon
                        name={cat.iconName}
                        customIconUrl={cat.customIconUrl}
                        className="w-5 h-5 text-white"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">
                        #{cat.order} • {cat.name}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">{cat.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditCategory(cat)}
                      className="p-2 text-[#0A4D9C] hover:bg-blue-50 rounded-xl"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        askConfirm(
                          "Excluir Categoria",
                          `Deseja realmente excluir a categoria "${cat.name}"?`,
                          async () => {
                            await deleteDoc(doc(db, "categories", cat.id));
                            setCategories((prev) => prev.filter((c) => c.id !== cat.id));
                          }
                        )
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== ABA 3: UTILIDADES RÁPIDAS ==================== */}
        {activeTab === "utilidades" && (
          <div className="space-y-6">
            {utilities.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-[#0A4D9C]">
                    O site está exibindo os 9 telefones úteis padrão.
                  </p>
                  <p className="text-xs text-slate-600">
                    Importe para o banco para editar números, nomes, ícones ou criar novos botões.
                  </p>
                </div>
                <button
                  onClick={handleImportDefaultUtilities}
                  className="bg-[#0A4D9C] text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" /> Importar 9 Utilidades Padrão
                </button>
              </div>
            )}

            <form
              onSubmit={handleSaveUtility}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-slate-900">
                  {editingUtilId
                    ? `Editando Utilidade: ${utilName}`
                    : "Adicionar Novo Telefone / Utilidade Rápida"}
                </h2>
                {editingUtilId && (
                  <button
                    type="button"
                    onClick={resetUtilityForm}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Órgão / Serviço *
                  </label>
                  <input
                    type="text"
                    required
                    value={utilName}
                    onChange={(e) => setUtilName(e.target.value)}
                    placeholder="Ex: Guarda Municipal"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    value={utilNumber}
                    onChange={(e) => setUtilNumber(e.target.value)}
                    placeholder="Ex: 153 ou (64) 3454-3500"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={utilOrder}
                    onChange={(e) => setUtilOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Cor do Ícone
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setUtilColor(c.value)}
                      className={`w-8 h-8 rounded-xl ${c.value} transition ${
                        utilColor === c.value
                          ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Escolha um Ícone (ou envie PNG)
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer">
                    {uploadingUtilIcon ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Subir Ícone PNG
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadUtilityIcon}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50">
                  {ICON_OPTIONS.map((ic) => (
                    <button
                      type="button"
                      key={ic.name}
                      onClick={() => {
                        setUtilIconName(ic.name);
                        setUtilCustomIconUrl("");
                      }}
                      title={ic.label}
                      className={`p-2.5 rounded-xl flex items-center justify-center transition ${
                        !utilCustomIconUrl && utilIconName === ic.name
                          ? `${utilColor} text-white shadow`
                          : "bg-white text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <CategoryIcon name={ic.name} className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-5 py-3 rounded-xl inline-flex items-center gap-2"
              >
                {editingUtilId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingUtilId ? "Salvar Utilidade" : "Adicionar Telefone Útil"}
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {utilities.map((util) => (
                <div
                  key={util.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${util.color} flex items-center justify-center shrink-0`}
                    >
                      <CategoryIcon
                        name={util.iconName}
                        customIconUrl={util.customIconUrl}
                        className="w-5 h-5 text-white"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{util.name}</p>
                      <p className="text-xs font-extrabold text-red-600">{util.number}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditUtility(util)}
                      className="p-2 text-[#0A4D9C] hover:bg-blue-50 rounded-xl"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        askConfirm(
                          "Excluir Utilidade Rápida",
                          `Deseja remover "${util.name} (${util.number})" da barra de utilidades?`,
                          async () => {
                            await deleteDoc(doc(db, "utilities", util.id));
                            setUtilities((prev) => prev.filter((u) => u.id !== util.id));
                          }
                        )
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== ABA 4: BANNERS PROMOCIONAIS ==================== */}
        {activeTab === "banners" && (
          <div className="space-y-6">
            <form
              onSubmit={handleSaveBanner}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-slate-900">
                  {editingBannerId ? "Editando Banner" : "Cadastrar Novo Banner Pago"}
                </h2>
                {editingBannerId && (
                  <button
                    type="button"
                    onClick={resetBannerForm}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cliente / Título *
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
                    Local de Exibição
                  </label>
                  <select
                    value={bannerPlacement}
                    onChange={(e) => setBannerPlacement(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                  >
                    <option value="home">Página Inicial (Home)</option>
                    {activeCategoryChoices.map((c) => (
                      <option key={c.slug || c.id} value={c.slug || c.id}>
                        Segmento: {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link de Destino
                  </label>
                  <input
                    type="text"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="https://wa.me/5564..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={bannerOrder}
                    onChange={(e) => setBannerOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-3 rounded-xl cursor-pointer">
                    {uploadingBanner ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {bannerImageUrl ? "Trocar Arte" : "Enviar Arte (1200x400px, máx 1MB)"}
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

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerActive}
                      onChange={(e) => setBannerActive(e.target.checked)}
                      className="w-4 h-4 accent-[#0A4D9C]"
                    />
                    Banner Ativo
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={uploadingBanner}
                  className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5"
                >
                  {editingBannerId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingBannerId ? "Salvar Alterações" : "Publicar Banner"}
                </button>
              </div>
            </form>

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
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900">{ban.title}</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ban.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {ban.active ? "Ativo" : "Pausado"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Local: <span className="font-bold uppercase">{ban.placement}</span> • Ordem: {ban.order}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditBanner(ban)}
                        className="p-2 text-[#0A4D9C] hover:bg-blue-50 rounded-xl"
                        title="Editar Banner"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          askConfirm(
                            "Excluir Banner",
                            `Tem certeza que deseja remover o banner "${ban.title}"?`,
                            async () => {
                              await deleteDoc(doc(db, "banners", ban.id));
                              setBanners((prev) => prev.filter((b) => b.id !== ban.id));
                            }
                          )
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                        title="Excluir Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== ABA 5: TEXTOS, BANNERS INFERIORES & VIP ==================== */}
        {activeTab === "textos" && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* 1. Topo e Busca */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
              <h2 className="font-extrabold text-slate-900">1. Textos do Topo e Busca</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Frase pequena acima do título
                  </label>
                  <input
                    type="text"
                    value={settings.heroBadge}
                    onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texto dentro da caixa de busca
                  </label>
                  <input
                    type="text"
                    value={settings.searchPlaceholder}
                    onChange={(e) =>
                      setSettings({ ...settings, searchPlaceholder: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Principal (Parte Branca)
                  </label>
                  <input
                    type="text"
                    value={settings.heroTitlePrefix}
                    onChange={(e) =>
                      setSettings({ ...settings, heroTitlePrefix: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Principal (Destaque Amarelo)
                  </label>
                  <input
                    type="text"
                    value={settings.heroTitleHighlight}
                    onChange={(e) =>
                      setSettings({ ...settings, heroTitleHighlight: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Títulos das Seções e Mais Procurados */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
              <h2 className="font-extrabold text-slate-900">
                2. Títulos das Seções & Botões Mais Procurados
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Seção Mais Procurados
                  </label>
                  <input
                    type="text"
                    value={settings.mostSearchedTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, mostSearchedTitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtítulo Mais Procurados
                  </label>
                  <input
                    type="text"
                    value={settings.mostSearchedSubtitle}
                    onChange={(e) =>
                      setSettings({ ...settings, mostSearchedSubtitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Empresas em Destaque
                  </label>
                  <input
                    type="text"
                    value={settings.featuredTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, featuredTitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Utilidades Rápidas
                  </label>
                  <input
                    type="text"
                    value={settings.utilitiesTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, utilitiesTitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Atalhos de Busca Rápida (Mais Procurados)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(settings.mostSearchedItems || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl"
                    >
                      {tag.label} ({tag.query})
                      <button
                        type="button"
                        onClick={() => handleRemoveSearchTag(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    placeholder="Nome do botão (ex: Açaiteria)"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={newTagQuery}
                    onChange={(e) => setNewTagQuery(e.target.value)}
                    placeholder="Termo buscado (ex: acai)"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSearchTag}
                    className="bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl"
                  >
                    + Adicionar Atalho
                  </button>
                </div>
              </div>
            </div>

            {/* 3. BANNER LARANJA: GRUPO VIP & MENSAGEM AUTOMÁTICA */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-orange-200 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF7A00]" />
                <h2 className="font-extrabold text-slate-900">
                  3. Banner Laranja — Clube Exclusivo / Grupo VIP
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Etiqueta Preta (Badge)
                  </label>
                  <input
                    type="text"
                    value={settings.vipGroupBadge}
                    onChange={(e) =>
                      setSettings({ ...settings, vipGroupBadge: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texto do Botão Preto
                  </label>
                  <input
                    type="text"
                    value={settings.vipGroupButtonText}
                    onChange={(e) =>
                      setSettings({ ...settings, vipGroupButtonText: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Grande do Banner Laranja
                  </label>
                  <input
                    type="text"
                    value={settings.vipGroupTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, vipGroupTitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texto Descritivo do Banner Laranja
                  </label>
                  <textarea
                    rows={2}
                    value={settings.vipGroupSubtitle}
                    onChange={(e) =>
                      setSettings({ ...settings, vipGroupSubtitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link do Grupo VIP (https://chat.whatsapp.com/... ou deixe padrão para abrir WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={settings.vipGroupUrl}
                    onChange={(e) => setSettings({ ...settings, vipGroupUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mensagem Automática que chega do Cliente (Grupo VIP)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.vipGroupMessage}
                    onChange={(e) =>
                      setSettings({ ...settings, vipGroupMessage: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 4. BANNER AZUL: ANUNCIE NO CALDAS ONLINE */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-blue-200 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#0A4D9C]" />
                <h2 className="font-extrabold text-slate-900">
                  4. Banner Azul — Anuncie no Caldas Online & Botões
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Principal do Banner Azul
                  </label>
                  <input
                    type="text"
                    value={settings.advertiseTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, advertiseTitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtítulo / Descrição do Banner Azul
                  </label>
                  <textarea
                    rows={2}
                    value={settings.advertiseSubtitle}
                    onChange={(e) =>
                      setSettings({ ...settings, advertiseSubtitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texto do Botão Branco (Cadastro)
                  </label>
                  <input
                    type="text"
                    value={settings.advertiseRegisterText}
                    onChange={(e) =>
                      setSettings({ ...settings, advertiseRegisterText: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link do Botão Branco (Padrão: /painel-empresa)
                  </label>
                  <input
                    type="text"
                    value={settings.advertiseRegisterUrl}
                    onChange={(e) =>
                      setSettings({ ...settings, advertiseRegisterUrl: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texto do Botão Verde (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={settings.advertiseWhatsappText}
                    onChange={(e) =>
                      setSettings({ ...settings, advertiseWhatsappText: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Seu Telefone WhatsApp (com 55 + DDD)
                  </label>
                  <input
                    type="text"
                    value={settings.masterWhatsApp}
                    onChange={(e) =>
                      setSettings({ ...settings, masterWhatsApp: e.target.value })
                    }
                    placeholder="5564981005505"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mensagem Automática que chega no seu WhatsApp (Botão Verde)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.advertiseWhatsappMessage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        advertiseWhatsappMessage: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-sm px-6 py-3.5 rounded-xl flex items-center gap-2 shadow"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              SALVAR TODOS OS TEXTOS, BOTÕES E MENSAGENS
            </button>
          </form>
        )}
      </main>

      {/* POP-UP DE ALERTA PARA EXCLUSÃO */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{confirmModal.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{confirmModal.message}</p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deletingItem}
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingItem}
                onClick={executeConfirm}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
              >
                {deletingItem && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer settings={settings} />
    </div>
  );
}
