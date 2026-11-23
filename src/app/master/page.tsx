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
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { compressAndUploadImage } from "@/lib/cloudinary";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_UTILITIES,
  DEFAULT_PLANS,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/constants";
import {
  Business,
  CategoryDoc,
  UtilityDoc,
  PlanDoc,
  PromoBanner,
  SiteSettings,
} from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CategoryIcon } from "@/components/CategoryIcon";
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
  Edit3,
  X,
  MessageCircle,
  Megaphone,
  PhoneCall,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  RefreshCw,
  BadgeCheck,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MASTER_EMAIL = "caldasonline10@gmail.com";

type ExtendedBanner = PromoBanner & {
  actionType?: "link" | "whatsapp";
  whatsappNumber?: string;
  whatsappMessage?: string;
  buttonText?: string;
};

const COLOR_PRESETS = [
  { label: "Laranja", value: "bg-orange-500" },
  { label: "Vermelho", value: "bg-red-500" },
  { label: "Vermelho Escuro", value: "bg-red-700" },
  { label: "Azul", value: "bg-blue-600" },
  { label: "Azul Escuro", value: "bg-blue-900" },
  { label: "Verde", value: "bg-emerald-600" },
  { label: "Roxo", value: "bg-purple-600" },
  { label: "Âmbar", value: "bg-amber-600" },
  { label: "Ciano", value: "bg-sky-500" },
  { label: "Rosa", value: "bg-pink-500" },
  { label: "Teal", value: "bg-teal-600" },
  { label: "Índigo", value: "bg-indigo-600" },
  { label: "Amarelo", value: "bg-yellow-500" },
  { label: "Grafite", value: "bg-slate-600" },
];

export default function MasterAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "businesses" | "plans" | "banners" | "categories" | "utilities" | "settings"
  >("businesses");

  // Empresas
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Planos
  const [plans, setPlans] = useState<PlanDoc[]>(DEFAULT_PLANS);
  const [editingPlan, setEditingPlan] = useState<PlanDoc | null>(null);
  const [editingPlanOrderInput, setEditingPlanOrderInput] = useState("0");
  const [editingPlanFeaturesText, setEditingPlanFeaturesText] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [copiedPlansLink, setCopiedPlansLink] = useState(false);

  // Categorias + Drag & Drop
  const [categories, setCategories] = useState<CategoryDoc[]>(DEFAULT_CATEGORIES);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSubtitle, setNewCatSubtitle] = useState("");
  const [editingCat, setEditingCat] = useState<CategoryDoc | null>(null);
  const [editingCatOrderInput, setEditingCatOrderInput] = useState("1");
  const [editingCatQuickTagsText, setEditingCatQuickTagsText] = useState("");
  const [uploadingCatIcon, setUploadingCatIcon] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [syncingCategories, setSyncingCategories] = useState(false);
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);
  const [dragOverCatIndex, setDragOverCatIndex] = useState<number | null>(null);
  const [savingCatOrder, setSavingCatOrder] = useState(false);

  // Utilidades Rápidas
  const [utilities, setUtilities] = useState<UtilityDoc[]>(DEFAULT_UTILITIES);
  const [newUtilName, setNewUtilName] = useState("");
  const [newUtilNumber, setNewUtilNumber] = useState("");
  const [editingUtil, setEditingUtil] = useState<UtilityDoc | null>(null);
  const [editingUtilOrderInput, setEditingUtilOrderInput] = useState("1");
  const [uploadingUtilIcon, setUploadingUtilIcon] = useState(false);
  const [savingUtil, setSavingUtil] = useState(false);

  // Banners Patrocinados (Home + Segmentos) — vazio/0 = Aleatório por padrão
  const [banners, setBanners] = useState<ExtendedBanner[]>([]);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerPlacement, setBannerPlacement] = useState("home");
  const [bannerActionType, setBannerActionType] = useState<"link" | "whatsapp">("whatsapp");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [bannerWhatsapp, setBannerWhatsapp] = useState("");
  const [bannerWhatsappMsg, setBannerWhatsappMsg] = useState("");
  const [bannerButtonText, setBannerButtonText] = useState("");
  const [bannerOrderInput, setBannerOrderInput] = useState("");
  const [uploadingPromoBanner, setUploadingPromoBanner] = useState(false);
  const [savingPromoBanner, setSavingPromoBanner] = useState(false);

  // Edição de Banner Existente
  const [editingBanner, setEditingBanner] = useState<ExtendedBanner | null>(null);
  const [editingBannerOrderInput, setEditingBannerOrderInput] = useState("");
  const [uploadingEditBanner, setUploadingEditBanner] = useState(false);
  const [savingEditBanner, setSavingEditBanner] = useState(false);

  // Configurações Globais + Mais Procurados
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [newSearchLabel, setNewSearchLabel] = useState("");
  const [newSearchQuery, setNewSearchQuery] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingMostSearched, setTogglingMostSearched] = useState(false);

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
      bizList.sort((a, b) => {
        const aPending = a.isApproved === false ? 0 : 1;
        const bPending = b.isApproved === false ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      setBusinesses(bizList);

      // 2. Planos (mescla os 4 padrões com os salvos no Firestore para nenhum plano desaparecer)
      const snapPlans = await getDocs(collection(db, "plans"));
      const firestorePlansMap = new Map<string, PlanDoc>();
      snapPlans.docs.forEach((d) => {
        firestorePlansMap.set(d.id, {
          ...(d.data() as Omit<PlanDoc, "id">),
          id: d.id,
        });
      });

      const mergedPlansMap = new Map<string, PlanDoc>();
      DEFAULT_PLANS.forEach((def) => {
        mergedPlansMap.set(def.id, firestorePlansMap.get(def.id) || def);
      });
      firestorePlansMap.forEach((val, key) => {
        if (!mergedPlansMap.has(key)) {
          mergedPlansMap.set(key, val);
        }
      });

      const planList = Array.from(mergedPlansMap.values()).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      setPlans(planList);

      // 3. Categorias
      const snapCats = await getDocs(collection(db, "categories"));
      if (!snapCats.empty) {
        const catList = snapCats.docs
          .map((d) => ({ ...(d.data() as Omit<CategoryDoc, "id">), id: d.id }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategories(catList);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      // 4. Utilidades Rápidas
      const snapUtils = await getDocs(collection(db, "utilities"));
      if (!snapUtils.empty) {
        const utilList = snapUtils.docs
          .map((d) => ({ ...(d.data() as Omit<UtilityDoc, "id">), id: d.id }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setUtilities(utilList);
      } else {
        setUtilities(DEFAULT_UTILITIES);
      }

      // 5. Banners Patrocinados
      const snapBanners = await getDocs(collection(db, "banners"));
      const banList = snapBanners.docs
        .map((d) => ({ ...(d.data() as Omit<ExtendedBanner, "id">), id: d.id }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setBanners(banList);

      // 6. Configurações Globais
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

  // MODERAÇÃO DE EMPRESAS
  const handleApproveBusiness = async (biz: Business) => {
    const confirmed = window.confirm(
      `✅ LIBERAR EMPRESA?\n\nDeseja aprovar e publicar "${biz.name}" imediatamente no guia Caldas Novas Online?`
    );
    if (!confirmed) return;

    setUpdatingId(biz.id);
    try {
      await updateDoc(doc(db, "businesses", biz.id), {
        isApproved: true,
        isVerified: biz.isVerified !== false,
        approvedAt: Date.now(),
      });
      setBusinesses((prev) =>
        prev.map((item) =>
          item.id === biz.id
            ? { ...item, isApproved: true, isVerified: biz.isVerified !== false }
            : item
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
      `🚨 EXCLUIR DEFINITIVAMENTE?\n\nAtenção: Esta ação apaga "${biz.name}" permanentemente do guia e NÃO pode ser desfeita.\n\nDeseja realmente excluir?`
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
      alert("Erro ao atualizar empresa.");
    } finally {
      setUpdatingId(null);
    }
  };

  // GERENCIAMENTO DE PLANOS (GRÁTIS, VITRINE, DESTAQUE, MASTER)
  const openEditPlanModal = (plan: PlanDoc) => {
    setEditingPlan({ ...plan });
    setEditingPlanOrderInput(plan.order && plan.order > 0 ? String(plan.order) : "");
    setEditingPlanFeaturesText((plan.features || []).join("\n"));
  };

  const handleOpenNewPlanModal = () => {
    const newId = `plano-${Date.now()}`;
    setEditingPlan({
      id: newId,
      name: "",
      subtitle: "",
      price: 99.9,
      billingPeriod: "/mês",
      maxPhotos: 20,
      maxVideos: 2,
      hasFeaturedHome: false,
      hasBannerHome: false,
      hasBannerSegment: false,
      badgeText: "",
      highlight: false,
      features: [],
      buttonText: "Contratar no WhatsApp",
      order: 0,
      active: true,
    });
    setEditingPlanOrderInput("");
    setEditingPlanFeaturesText("Página completa no guia\nBotão direto para WhatsApp");
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editingPlan.name.trim()) return;
    setSavingPlan(true);

    try {
      const featuresList = editingPlanFeaturesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const parsedOrder = parseInt(editingPlanOrderInput.replace(/\D/g, ""), 10);

      const updated: PlanDoc = {
        ...editingPlan,
        name: editingPlan.name.trim(),
        subtitle: editingPlan.subtitle.trim(),
        price: Number(editingPlan.price) || 0,
        maxPhotos: Math.max(1, Number(editingPlan.maxPhotos) || 6),
        maxVideos: Math.max(0, Math.min(4, Number(editingPlan.maxVideos) || 0)),
        order: !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : 0,
        features: featuresList,
      };

      await setDoc(doc(db, "plans", updated.id), updated, { merge: true });

      setPlans((prev) => {
        const exists = prev.some((p) => p.id === updated.id);
        const next = exists
          ? prev.map((p) => (p.id === updated.id ? updated : p))
          : [...prev, updated];
        return next.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      });

      setEditingPlan(null);
      alert("✅ Plano salvo e atualizado na página pública /planos!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar plano.");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleTogglePlanActive = async (plan: PlanDoc) => {
    const nextActive = plan.active === false;
    try {
      await setDoc(
        doc(db, "plans", plan.id),
        { ...plan, active: nextActive },
        { merge: true }
      );
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, active: nextActive } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyPlansUrl = () => {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/planos`
        : "https://caldasnovasonline.com.br/planos";
    navigator.clipboard.writeText(fullUrl);
    setCopiedPlansLink(true);
    setTimeout(() => setCopiedPlansLink(false), 3000);
  };

  // CATEGORIAS + REORDENAÇÃO POR ARRASTAR OU SETAS + TEMAS RÁPIDOS
  const persistCategoryOrder = async (reorderedList: CategoryDoc[]) => {
    const normalized = reorderedList.map((cat, idx) => ({
      ...cat,
      order: idx + 1,
    }));
    setCategories(normalized);
    setSavingCatOrder(true);
    try {
      const batch = writeBatch(db);
      normalized.forEach((cat) => {
        const docId = cat.slug || cat.id;
        batch.set(
          doc(db, "categories", docId),
          { ...cat, id: docId, slug: docId, order: cat.order },
          { merge: true }
        );
      });
      await batch.commit();
    } catch (err) {
      console.error("Erro ao salvar ordem das categorias:", err);
      alert("Erro ao salvar nova ordem das categorias.");
    } finally {
      setSavingCatOrder(false);
    }
  };

  const handleMoveCategory = async (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= categories.length ||
      toIndex >= categories.length
    ) {
      return;
    }
    const updated = [...categories];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    await persistCategoryOrder(updated);
  };

  const handleResetCategoriesToDefault = async () => {
    const confirmed = window.confirm(
      "🔄 ATUALIZAR PARA AS 10 CATEGORIAS NOVAS?\n\nIsso vai substituir as categorias antigas no banco pelas 10 novas (Onde Comer, Onde Ficar, Turismo & Parques, Imóveis, Saúde & Bem-estar, Casa & Reforma, Energia Solar, Ar Condicionado, Automotivo & Mobilidade e Profissionais & Serviços).\n\nDeseja aplicar agora?"
    );
    if (!confirmed) return;

    setSyncingCategories(true);
    try {
      const batch = writeBatch(db);
      const snapExisting = await getDocs(collection(db, "categories"));
      snapExisting.docs.forEach((d) => {
        batch.delete(d.ref);
      });

      DEFAULT_CATEGORIES.forEach((cat) => {
        batch.set(doc(db, "categories", cat.slug || cat.id), cat);
      });

      await batch.commit();
      setCategories(DEFAULT_CATEGORIES);
      alert("✅ As 10 novas categorias foram gravadas no banco com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar categorias no banco.");
    } finally {
      setSyncingCategories(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const slug = newCatName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const payload = {
      id: slug,
      name: newCatName.trim(),
      slug,
      subtitle: newCatSubtitle.trim() || "Empresas e serviços locais",
      iconName: "Store",
      bgColor: "bg-blue-600",
      quickTags: [],
      order: categories.length + 1,
      active: true,
    } as CategoryDoc;

    try {
      await setDoc(doc(db, "categories", slug), payload);
      setCategories((prev) => [...prev, payload]);
      setNewCatName("");
      setNewCatSubtitle("");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar categoria.");
    }
  };

  const openEditCategoryModal = (cat: CategoryDoc) => {
    setEditingCat(cat);
    setEditingCatOrderInput(String(cat.order || 1));
    setEditingCatQuickTagsText((cat.quickTags || []).join(", "));
  };

  const handleUploadCategoryImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingCat) return;
    setUploadingCatIcon(true);
    try {
      const url = await compressAndUploadImage(file);
      setEditingCat({ ...editingCat, customIconUrl: url });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploadingCatIcon(false);
      e.target.value = "";
    }
  };

  const handleSaveEditedCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    setSavingCat(true);
    try {
      const docId = editingCat.slug || editingCat.id;
      const parsedOrder = parseInt(editingCatOrderInput.replace(/\D/g, ""), 10);
      const parsedQuickTags = editingCatQuickTagsText
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const updated: CategoryDoc = {
        ...editingCat,
        id: docId,
        slug: docId,
        quickTags: parsedQuickTags,
        order: !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : 1,
      };
      await setDoc(doc(db, "categories", docId), updated, { merge: true });
      setCategories((prev) =>
        prev
          .map((c) => (c.id === editingCat.id ? updated : c))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      );
      setEditingCat(null);
      alert("✅ Categoria e temas rápidos salvos com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar categoria.");
    } finally {
      setSavingCat(false);
    }
  };

  const handleToggleCategory = async (cat: CategoryDoc) => {
    const nextActive = cat.active === false;
    const docId = cat.slug || cat.id;
    try {
      await setDoc(
        doc(db, "categories", docId),
        { ...cat, id: docId, slug: docId, active: nextActive },
        { merge: true }
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, active: nextActive } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // UTILIDADES RÁPIDAS
  const handleAddUtility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUtilName.trim() || !newUtilNumber.trim()) return;

    const id = `util-${Date.now()}`;
    const payload: UtilityDoc = {
      id,
      name: newUtilName.trim(),
      number: newUtilNumber.trim(),
      iconName: "PhoneCall",
      color: "bg-blue-600",
      order: utilities.length + 1,
      active: true,
    };

    try {
      await setDoc(doc(db, "utilities", id), payload);
      setUtilities((prev) => [...prev, payload]);
      setNewUtilName("");
      setNewUtilNumber("");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar utilidade.");
    }
  };

  const openEditUtilityModal = (util: UtilityDoc) => {
    setEditingUtil(util);
    setEditingUtilOrderInput(String(util.order || 1));
  };

  const handleUploadUtilityImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingUtil) return;
    setUploadingUtilIcon(true);
    try {
      const url = await compressAndUploadImage(file);
      setEditingUtil({ ...editingUtil, customIconUrl: url });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploadingUtilIcon(false);
      e.target.value = "";
    }
  };

  const handleSaveEditedUtility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUtil) return;
    setSavingUtil(true);
    try {
      const parsedOrder = parseInt(editingUtilOrderInput.replace(/\D/g, ""), 10);
      const updatedUtil: UtilityDoc = {
        ...editingUtil,
        order: !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : 1,
      };
      await setDoc(doc(db, "utilities", updatedUtil.id), updatedUtil, {
        merge: true,
      });
      setUtilities((prev) =>
        prev
          .map((u) => (u.id === updatedUtil.id ? updatedUtil : u))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      );
      setEditingUtil(null);
      alert("✅ Utilidade atualizada com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar utilidade.");
    } finally {
      setSavingUtil(false);
    }
  };

  const handleToggleUtility = async (util: UtilityDoc) => {
    const nextActive = util.active === false;
    try {
      await setDoc(
        doc(db, "utilities", util.id),
        { ...util, active: nextActive },
        { merge: true }
      );
      setUtilities((prev) =>
        prev.map((u) => (u.id === util.id ? { ...u, active: nextActive } : u))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUtility = async (util: UtilityDoc) => {
    const confirmed = window.confirm(
      `Excluir "${util.name}" (${util.number}) da lista de Utilidades Rápidas?`
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "utilities", util.id));
      setUtilities((prev) => prev.filter((u) => u.id !== util.id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir utilidade.");
    }
  };

  // BANNERS PATROCINADOS
  const handleUploadPromoBannerFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPromoBanner(true);
    try {
      const url = await compressAndUploadImage(file);
      setBannerImageUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar arte do banner.");
    } finally {
      setUploadingPromoBanner(false);
      e.target.value = "";
    }
  };

  const handleCreatePromoBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImageUrl.trim()) {
      alert("Envie a imagem do banner antes de publicar.");
      return;
    }

    if (bannerActionType === "link" && !bannerLinkUrl.trim()) {
      alert("Informe o link de destino do banner (site, cardápio ou página interna).");
      return;
    }

    if (bannerActionType === "whatsapp" && !bannerWhatsapp.trim()) {
      alert("Informe o número de WhatsApp do anunciante (com DDD).");
      return;
    }

    setSavingPromoBanner(true);
    try {
      const newId = `banner-${Date.now()}`;
      const parsedOrder = parseInt(bannerOrderInput.replace(/\D/g, ""), 10);

      const payload: ExtendedBanner = {
        id: newId,
        title: bannerTitle.trim() || "Oferta em Destaque",
        imageUrl: bannerImageUrl.trim(),
        placement: bannerPlacement,
        actionType: bannerActionType,
        linkUrl: bannerActionType === "link" ? bannerLinkUrl.trim() : "",
        whatsappNumber:
          bannerActionType === "whatsapp"
            ? bannerWhatsapp.replace(/\D/g, "")
            : "",
        whatsappMessage:
          bannerActionType === "whatsapp" ? bannerWhatsappMsg.trim() : "",
        buttonText: bannerButtonText.trim(),
        order: !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : 0,
        active: true,
      };

      await setDoc(doc(db, "banners", newId), payload);
      setBanners((prev) =>
        [...prev, payload].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );

      setBannerTitle("");
      setBannerImageUrl("");
      setBannerLinkUrl("");
      setBannerWhatsapp("");
      setBannerWhatsappMsg("");
      setBannerButtonText("");
      setBannerOrderInput("");
      alert("✅ Banner patrocinado publicado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar banner patrocinado.");
    } finally {
      setSavingPromoBanner(false);
    }
  };

  const openEditBannerModal = (banner: ExtendedBanner) => {
    setEditingBanner({
      ...banner,
      actionType: banner.actionType || (banner.whatsappNumber ? "whatsapp" : "link"),
      whatsappNumber: banner.whatsappNumber || "",
      whatsappMessage: banner.whatsappMessage || "",
      linkUrl: banner.linkUrl || "",
      buttonText: banner.buttonText || "",
      order: banner.order ?? 0,
    });
    setEditingBannerOrderInput(
      banner.order && banner.order > 0 ? String(banner.order) : ""
    );
  };

  const handleUploadEditBannerFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingBanner) return;
    setUploadingEditBanner(true);
    try {
      const url = await compressAndUploadImage(file);
      setEditingBanner({ ...editingBanner, imageUrl: url });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar nova arte do banner.");
    } finally {
      setUploadingEditBanner(false);
      e.target.value = "";
    }
  };

  const handleSaveEditedBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    if (!editingBanner.imageUrl.trim()) {
      alert("Envie a imagem do banner antes de salvar.");
      return;
    }

    const actionType = editingBanner.actionType || "whatsapp";
    if (actionType === "link" && !(editingBanner.linkUrl || "").trim()) {
      alert("Informe o link de destino do banner.");
      return;
    }

    if (actionType === "whatsapp" && !(editingBanner.whatsappNumber || "").trim()) {
      alert("Informe o número de WhatsApp do anunciante (com DDD).");
      return;
    }

    setSavingEditBanner(true);
    try {
      const parsedOrder = parseInt(editingBannerOrderInput.replace(/\D/g, ""), 10);

      const updated: ExtendedBanner = {
        ...editingBanner,
        title: editingBanner.title.trim() || "Oferta em Destaque",
        imageUrl: editingBanner.imageUrl.trim(),
        placement: editingBanner.placement || "home",
        actionType,
        linkUrl: actionType === "link" ? (editingBanner.linkUrl || "").trim() : "",
        whatsappNumber:
          actionType === "whatsapp"
            ? (editingBanner.whatsappNumber || "").replace(/\D/g, "")
            : "",
        whatsappMessage:
          actionType === "whatsapp"
            ? (editingBanner.whatsappMessage || "").trim()
            : "",
        buttonText: (editingBanner.buttonText || "").trim(),
        order: !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : 0,
      };

      await setDoc(doc(db, "banners", updated.id), updated, { merge: true });
      setBanners((prev) =>
        prev
          .map((b) => (b.id === updated.id ? updated : b))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
      setEditingBanner(null);
      alert("✅ Banner atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar alterações do banner.");
    } finally {
      setSavingEditBanner(false);
    }
  };

  const handleToggleBannerActive = async (banner: ExtendedBanner) => {
    const nextActive = !banner.active;
    try {
      await updateDoc(doc(db, "banners", banner.id), { active: nextActive });
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: nextActive } : b))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBanner = async (banner: ExtendedBanner) => {
    const confirmed = window.confirm(
      `Excluir o banner "${banner.title}" permanentemente?`
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "banners", banner.id));
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir banner.");
    }
  };

  // MAIS PROCURADOS (OCULTAR/ATIVAR SEM APAGAR + ADICIONAR/REMOVER TERMOS)
  const handleToggleMostSearchedVisibility = async () => {
    const nextVisible = settings.showMostSearched === false;
    const updatedSettings: SiteSettings = {
      ...settings,
      showMostSearched: nextVisible,
    };
    setSettings(updatedSettings);
    setTogglingMostSearched(true);
    try {
      await setDoc(doc(db, "settings", "global"), updatedSettings, {
        merge: true,
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar visibilidade na Home.");
    } finally {
      setTogglingMostSearched(false);
    }
  };

  const handleAddMostSearched = () => {
    const label = newSearchLabel.trim();
    if (!label) return;
    const queryValue = newSearchQuery.trim() || label;
    const currentList = settings.mostSearchedItems || [];

    setSettings({
      ...settings,
      mostSearchedItems: [...currentList, { label, query: queryValue }],
    });
    setNewSearchLabel("");
    setNewSearchQuery("");
  };

  const handleRemoveMostSearched = (indexToRemove: number) => {
    const currentList = settings.mostSearchedItems || [];
    setSettings({
      ...settings,
      mostSearchedItems: currentList.filter((_, idx) => idx !== indexToRemove),
    });
  };

  // CONFIGURAÇÕES GLOBAIS
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings, { merge: true });
      alert("✅ Configurações salvas! A página inicial já reflete as alterações.");
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
              Acesso exclusivo para moderação, planos e gestão do Caldas Novas Online.
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

  const getPlacementLabel = (placement: string) => {
    if (placement === "home") return "🏠 Página Inicial (Home)";
    const found = categories.find((c) => (c.slug || c.id) === placement);
    return found ? `📂 Segmento: ${found.name}` : `📂 Segmento: ${placement}`;
  };

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
                Administração Master • Caldas Novas Online
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
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              activeTab === "plans"
                ? "bg-[#0A4D9C] text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#FF7A00]" />
            Planos & Preços ({plans.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("banners")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              activeTab === "banners"
                ? "bg-[#0A4D9C] text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Banners Patrocinados ({banners.length})
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
            Categorias ({categories.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("utilities")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              activeTab === "utilities"
                ? "bg-[#0A4D9C] text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            Utilidades Rápidas ({utilities.length})
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
            Mais Procurados & WhatsApp
          </button>
        </div>

        {/* ABA 1: EMPRESAS & MODERAÇÃO */}
        {activeTab === "businesses" && (
          <div className="space-y-4">
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
                  const isVerified = biz.isVerified !== false;

                  return (
                    <div
                      key={biz.id}
                      className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition space-y-4 ${
                        isPending
                          ? "border-amber-400 bg-amber-50/20"
                          : "border-slate-100"
                      }`}
                    >
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

                          {isVerified && (
                            <span className="inline-flex items-center gap-1 bg-sky-100 text-[#0A4D9C] text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                              <BadgeCheck className="w-3.5 h-3.5" /> Verificada
                            </span>
                          )}

                          {biz.isFeatured && (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-[#0A4D9C] text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                              <Star className="w-3 h-3 fill-[#0A4D9C]" /> Patrocinada
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/empresa/${biz.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#0A4D9C] font-extrabold text-xs px-3.5 py-2 rounded-xl transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Vistoriar Página
                        </Link>
                      </div>

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
                                isVerified: !isVerified,
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1 transition cursor-pointer ${
                              isVerified
                                ? "bg-[#0A4D9C] text-white"
                                : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                            {isVerified ? "Verificada" : "Verificar"}
                          </button>

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

        {/* ABA 2: PLANOS & PREÇOS */}
        {activeTab === "plans" && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-[#0A4D9C] to-[#062F63] text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <h2 className="text-lg font-black">
                  Catálogo de Planos (Grátis, Vitrine, Destaque e Master)
                </h2>
                <p className="text-xs text-blue-100 mt-0.5">
                  Edite valores, quantidade de fotos, vídeos e benefícios abaixo. Ordem <strong>0</strong> (ou vazio) mistura a cada acesso; <strong>1, 2, 3</strong> fixa na posição.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPlansUrl}
                  className="bg-[#FF7A00] hover:bg-orange-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  {copiedPlansLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      Link Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Link para Cliente
                    </>
                  )}
                </button>

                <Link
                  href="/planos"
                  target="_blank"
                  className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Página /planos
                </Link>

                <button
                  type="button"
                  onClick={handleOpenNewPlanModal}
                  className="bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Novo Plano
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl p-5 border-2 flex flex-col justify-between space-y-4 ${
                    plan.highlight
                      ? "border-[#FF7A00] shadow-md"
                      : "border-slate-200/80 shadow-sm"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          {!plan.order || plan.order <= 0
                            ? "🎲 Aleatório (0)"
                            : `📌 Fixo #${plan.order}`}
                        </span>
                        <h3 className="text-lg font-black text-slate-900">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-slate-500">{plan.subtitle}</p>
                      </div>

                      {plan.badgeText && (
                        <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full shrink-0">
                          {plan.badgeText}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-2xl font-black text-[#0A4D9C]">
                        {!plan.price || plan.price <= 0
                          ? "Grátis"
                          : plan.price.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                        {plan.price > 0 && (
                          <span className="text-xs font-bold text-slate-500 ml-1">
                            {plan.billingPeriod || "/mês"}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">
                      <p className="font-bold">
                        📸 Até <strong>{plan.maxPhotos} fotos</strong>
                      </p>
                      <p className="font-bold">
                        🎬 Até <strong>{plan.maxVideos} vídeo(s)</strong>
                      </p>
                      <p>
                        ⭐ Destaque na Home:{" "}
                        <strong>{plan.hasFeaturedHome ? "Sim" : "Não"}</strong>
                      </p>
                      <p>
                        🖼️ Full Banner Home:{" "}
                        <strong>{plan.hasBannerHome ? "Sim" : "Não"}</strong>
                      </p>
                      <p>
                        📂 Banner Segmento:{" "}
                        <strong>{plan.hasBannerSegment ? "Sim" : "Não"}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEditPlanModal(plan)}
                      className="flex-1 bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Plano
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePlanActive(plan)}
                      className={`px-3 py-2.5 rounded-xl text-[11px] font-extrabold cursor-pointer ${
                        plan.active !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {plan.active !== false ? "Ativo" : "Oculto"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: BANNERS PATROCINADOS */}
        {activeTab === "banners" && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreatePromoBanner}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4"
            >
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Criar Novo Banner Patrocinado (Slide)
                </h2>
                <p className="text-xs text-slate-500">
                  Deixe a ordem em branco ou <strong>0</strong> para misturar aleatoriamente a cada acesso, ou digite <strong>1, 2, 3...</strong> para fixar no início do slide.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome / Identificação do Anunciante *
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Ex: Piratas Pizzaria • Rodízio"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Onde exibir este banner? *
                  </label>
                  <select
                    value={bannerPlacement}
                    onChange={(e) => setBannerPlacement(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white font-semibold"
                  >
                    <option value="home">🏠 Página Inicial (Home)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug || cat.id}>
                        📂 Segmento: {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ordem (Vazio ou 0 = Aleatório • 1, 2, 3 = Fixo)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bannerOrderInput}
                    onChange={(e) =>
                      setBannerOrderInput(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="0 (Aleatório)"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Arte do Banner Full (Ideal: 1200x300px Horizontal) *
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer">
                      {uploadingPromoBanner ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploadingPromoBanner ? "Enviando Arte..." : "Enviar Arte do Banner"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadPromoBannerFile}
                        className="hidden"
                      />
                    </label>
                    {bannerImageUrl && (
                      <span className="text-xs font-bold text-emerald-700">
                        ✅ Imagem carregada com sucesso
                      </span>
                    )}
                  </div>
                  {bannerImageUrl && (
                    <img
                      src={bannerImageUrl}
                      alt="Prévia do Banner"
                      className="w-full max-h-48 object-cover rounded-2xl border border-slate-200 mt-2"
                    />
                  )}
                </div>

                <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Ação ao clicar no Banner *
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setBannerActionType("whatsapp")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition cursor-pointer ${
                        bannerActionType === "whatsapp"
                          ? "bg-[#1DB954] text-white border-[#1DB954]"
                          : "bg-white text-slate-700 border-slate-300"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Botão Ação WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() => setBannerActionType("link")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition cursor-pointer ${
                        bannerActionType === "link"
                          ? "bg-[#0A4D9C] text-white border-[#0A4D9C]"
                          : "bg-white text-slate-700 border-slate-300"
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Link para Site / Página
                    </button>
                  </div>

                  {bannerActionType === "whatsapp" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          WhatsApp do Anunciante (com DDD) *
                        </label>
                        <input
                          type="text"
                          value={bannerWhatsapp}
                          onChange={(e) => setBannerWhatsapp(e.target.value)}
                          placeholder="64999999999"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Texto do Botão (opcional)
                        </label>
                        <input
                          type="text"
                          value={bannerButtonText}
                          onChange={(e) => setBannerButtonText(e.target.value)}
                          placeholder="Ex: Pedir no WhatsApp"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mensagem Pronta no WhatsApp
                        </label>
                        <input
                          type="text"
                          value={bannerWhatsappMsg}
                          onChange={(e) => setBannerWhatsappMsg(e.target.value)}
                          placeholder="Olá! Vi a promoção no Caldas Novas Online..."
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Link de Destino (URL externa ou /empresa/slug) *
                        </label>
                        <input
                          type="text"
                          value={bannerLinkUrl}
                          onChange={(e) => setBannerLinkUrl(e.target.value)}
                          placeholder="https://... ou /empresa/nome-da-empresa"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Texto do Botão (opcional — deixe vazio para banner limpo)
                        </label>
                        <input
                          type="text"
                          value={bannerButtonText}
                          onChange={(e) => setBannerButtonText(e.target.value)}
                          placeholder="Ex: Ver Cardápio / Saiba Mais"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPromoBanner}
                className="bg-[#FF7A00] hover:bg-orange-500 text-slate-950 font-extrabold text-sm px-6 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {savingPromoBanner ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Publicar Banner no Slide
              </button>
            </form>

            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-base font-black text-slate-900">
                Banners Cadastrados ({banners.length})
              </h3>

              {banners.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Nenhum banner patrocinado cadastrado ainda. Use o formulário acima para criar o primeiro.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((ban) => (
                    <div
                      key={ban.id}
                      className="rounded-2xl border border-slate-200 overflow-hidden flex flex-col bg-slate-50"
                    >
                      <img
                        src={ban.imageUrl}
                        alt={ban.title}
                        className="w-full h-36 object-cover bg-slate-900"
                      />
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold bg-blue-100 text-[#0A4D9C] px-2.5 py-0.5 rounded-full">
                              {getPlacementLabel(ban.placement)}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {!ban.order || ban.order <= 0
                                ? "🎲 Aleatório (0)"
                                : `📌 Fixo #${ban.order}`}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900">
                            {ban.title}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {ban.actionType === "whatsapp"
                              ? `📱 WhatsApp: ${ban.whatsappNumber}`
                              : `🔗 Link: ${ban.linkUrl}`}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleBannerActive(ban)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                              ban.active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {ban.active ? "Ativo no Slide" : "Pausado"}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditBannerModal(ban)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#0A4D9C] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                              title="Editar banner, segmento, link ou imagem"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteBanner(ban)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 4: GERENCIAR, ORDENAR (ARRASTAR) E EDITAR CATEGORIAS */}
        {activeTab === "categories" && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">
                    Gerenciar Categorias do Guia
                  </h2>
                  {savingCatOrder && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-[#0A4D9C] px-2.5 py-0.5 rounded-full">
                      <Loader2 className="w-3 h-3 animate-spin" /> Salvando ordem...
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong>Clique, segure e arraste</strong> os cards para definir a posição na página inicial (ou use as setas <strong>← / →</strong> no celular). Clique no lápis para editar textos, fotos e temas rápidos.
                </p>
              </div>

              <button
                type="button"
                disabled={syncingCategories}
                onClick={handleResetCategoriesToDefault}
                className="bg-[#FF7A00] hover:bg-orange-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0 self-start sm:self-auto"
              >
                {syncingCategories ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Aplicar as 10 Categorias Novas no Banco
              </button>
            </div>

            <form
              onSubmit={handleAddCategory}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nome da nova categoria (ex: Pet Shop)"
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <input
                type="text"
                value={newCatSubtitle}
                onChange={(e) => setNewCatSubtitle(e.target.value)}
                placeholder="Subtítulo (ex: Banho, tosa, rações...)"
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-5 py-3 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Categoria
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categories.map((cat, idx) => {
                const isDragging = draggedCatIndex === idx;
                const isDragOver =
                  dragOverCatIndex === idx &&
                  draggedCatIndex !== null &&
                  draggedCatIndex !== idx;

                return (
                  <div
                    key={cat.id}
                    draggable
                    onDragStart={() => setDraggedCatIndex(idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverCatIndex !== idx) setDragOverCatIndex(idx);
                    }}
                    onDragLeave={() => {
                      if (dragOverCatIndex === idx) setDragOverCatIndex(null);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const from = draggedCatIndex;
                      setDraggedCatIndex(null);
                      setDragOverCatIndex(null);
                      if (from !== null && from !== idx) {
                        await handleMoveCategory(from, idx);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedCatIndex(null);
                      setDragOverCatIndex(null);
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between gap-2.5 transition select-none cursor-grab active:cursor-grabbing ${
                      isDragging
                        ? "opacity-45 border-[#0A4D9C] bg-blue-50/40"
                        : isDragOver
                        ? "border-[#FF7A00] bg-orange-50/60 scale-[1.01] shadow-md"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                    }`}
                  >
                    {/* Barra superior de posição e arraste */}
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/70">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-slate-600">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                        <span className="bg-slate-900 text-white px-2 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Arraste para mover
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0 || savingCatOrder}
                          onClick={() => handleMoveCategory(idx, idx - 1)}
                          title="Mover para posição anterior"
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categories.length - 1 || savingCatOrder}
                          onClick={() => handleMoveCategory(idx, idx + 1)}
                          title="Mover para próxima posição"
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo principal da Categoria */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl ${
                            cat.bgColor || "bg-blue-600"
                          } flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          <CategoryIcon
                            name={cat.iconName}
                            customIconUrl={cat.customIconUrl}
                            className="w-5 h-5 text-white"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">
                            {cat.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {cat.subtitle || `Slug: ${cat.slug}`}
                          </p>
                          {Array.isArray(cat.quickTags) && cat.quickTags.length > 0 && (
                            <p className="text-[10px] font-bold text-[#0A4D9C] truncate mt-0.5">
                              ⚡ {cat.quickTags.join(" • ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0A4D9C] transition cursor-pointer"
                          title="Editar texto, cor, foto e temas rápidos"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleCategory(cat)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                            cat.active !== false
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {cat.active !== false ? "Ativa" : "Oculta"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 5: UTILIDADES RÁPIDAS */}
        {activeTab === "utilities" && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Gerenciar Utilidades Rápidas (Telefones Úteis)
              </h2>
              <p className="text-xs text-slate-500">
                Estes contatos aparecem no botão <strong>Utilidades Públicas</strong> no rodapé do guia. Clique em <strong>Editar</strong> para alterar nome, número, cor ou foto.
              </p>
            </div>

            <form
              onSubmit={handleAddUtility}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <input
                type="text"
                required
                value={newUtilName}
                onChange={(e) => setNewUtilName(e.target.value)}
                placeholder="Nome do órgão / serviço (ex: Guarda Municipal)"
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <input
                type="text"
                required
                value={newUtilNumber}
                onChange={(e) => setNewUtilNumber(e.target.value)}
                placeholder="Telefone (ex: 153 ou (64) 3454-0000)"
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-5 py-3 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Utilidade
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {utilities.map((util) => (
                <div
                  key={util.id}
                  className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl ${
                        util.color || "bg-blue-600"
                      } flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <CategoryIcon
                        name={util.iconName}
                        customIconUrl={util.customIconUrl}
                        className="w-5 h-5 text-white"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">
                        {util.name}
                      </p>
                      <p className="text-xs font-extrabold text-red-600 truncate">
                        {util.number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditUtilityModal(util)}
                      className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0A4D9C] transition cursor-pointer"
                      title="Editar nome, número, cor e foto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleUtility(util)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                        util.active !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {util.active !== false ? "Ativo" : "Oculto"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUtility(util)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
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

        {/* ABA 6: MAIS PROCURADOS + WHATSAPP MASTER & GRUPO VIP */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* BLOCO 1: MAIS PROCURADOS DA PÁGINA INICIAL */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Seção &ldquo;Mais Procurados&rdquo; na Página Inicial
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ative ou oculte a seção na Home sem apagar seus termos cadastrados.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={togglingMostSearched}
                  onClick={handleToggleMostSearchedVisibility}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition self-start sm:self-auto inline-flex items-center gap-2 cursor-pointer ${
                    settings.showMostSearched !== false
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-slate-900 text-[#FFB800]"
                  }`}
                >
                  {togglingMostSearched && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {settings.showMostSearched !== false
                    ? "✅ Visível na Home (Clique para Ocultar)"
                    : "🙈 Oculta na Home (Clique para Ativar)"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título da Seção
                  </label>
                  <input
                    type="text"
                    value={settings.mostSearchedTitle || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mostSearchedTitle: e.target.value,
                      })
                    }
                    placeholder="Mais Procurados"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtítulo da Seção
                  </label>
                  <input
                    type="text"
                    value={settings.mostSearchedSubtitle || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mostSearchedSubtitle: e.target.value,
                      })
                    }
                    placeholder="Acesso rápido aos termos mais buscados em Caldas Novas"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Adicionar Novo Termo */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <p className="text-xs font-extrabold text-slate-800">
                  Adicionar botão de busca rápida:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newSearchLabel}
                    onChange={(e) => setNewSearchLabel(e.target.value)}
                    placeholder="Texto do botão (ex: Pizzarias)"
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                  />
                  <input
                    type="text"
                    value={newSearchQuery}
                    onChange={(e) => setNewSearchQuery(e.target.value)}
                    placeholder="Termo buscado (ex: pizza)"
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddMostSearched}
                    className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Termo
                  </button>
                </div>
              </div>

              {/* Lista dos Termos */}
              {(settings.mostSearchedItems || []).length === 0 ? (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-semibold">
                  Nenhum termo cadastrado no momento. Sem termos cadastrados, a seção também fica oculta na Página Inicial.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(settings.mostSearchedItems || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs shadow-2xs"
                    >
                      <span className="font-extrabold text-slate-900">
                        {item.label}
                      </span>
                      {item.query && item.query !== item.label && (
                        <span className="text-slate-400">
                          (busca: {item.query})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMostSearched(idx)}
                        className="text-red-500 hover:text-red-700 p-0.5 rounded-md hover:bg-red-50 cursor-pointer"
                        title="Remover termo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BLOCO 2: WHATSAPP MASTER & GRUPO VIP */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5">
              <h2 className="text-lg font-black text-slate-900">
                Grupo VIP e WhatsApp Master
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
                      setSettings({
                        ...settings,
                        masterWhatsApp: e.target.value,
                      })
                    }
                    placeholder="5564993049090"
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
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-sm px-6 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Tudo
            </button>
          </form>
        )}
      </main>

      {/* MODAL DE EDIÇÃO DO BANNER PATROCINADO */}
      {editingBanner && (
        <div
          onClick={() => setEditingBanner(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveEditedBanner}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                Editar Banner: {editingBanner.title}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome / Anunciante *
                </label>
                <input
                  type="text"
                  required
                  value={editingBanner.title}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Onde exibir este banner? *
                </label>
                <select
                  value={editingBanner.placement}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      placement: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white font-semibold"
                >
                  <option value="home">🏠 Página Inicial (Home)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug || cat.id}>
                      📂 Segmento: {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ordem (Vazio ou 0 = Aleatório • 1, 2, 3 = Fixo)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editingBannerOrderInput}
                  onChange={(e) =>
                    setEditingBannerOrderInput(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0 (Aleatório)"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="sm:col-span-3 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Arte do Banner (Trocar imagem)
                </label>
                {editingBanner.imageUrl && (
                  <img
                    src={editingBanner.imageUrl}
                    alt={editingBanner.title}
                    className="w-full max-h-40 object-cover rounded-2xl border border-slate-200"
                  />
                )}
                <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer">
                  {uploadingEditBanner ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploadingEditBanner ? "Enviando Nova Arte..." : "Substituir Arte do Banner"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadEditBannerFile}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="sm:col-span-3 pt-2 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Ação ao clicar no Banner *
                </label>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingBanner({
                        ...editingBanner,
                        actionType: "whatsapp",
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition cursor-pointer ${
                      (editingBanner.actionType || "whatsapp") === "whatsapp"
                        ? "bg-[#1DB954] text-white border-[#1DB954]"
                        : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Botão Ação WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingBanner({
                        ...editingBanner,
                        actionType: "link",
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition cursor-pointer ${
                      editingBanner.actionType === "link"
                        ? "bg-[#0A4D9C] text-white border-[#0A4D9C]"
                        : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Link para Site / Página
                  </button>
                </div>

                {(editingBanner.actionType || "whatsapp") === "whatsapp" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        WhatsApp (com DDD) *
                      </label>
                      <input
                        type="text"
                        value={editingBanner.whatsappNumber || ""}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            whatsappNumber: e.target.value,
                          })
                        }
                        placeholder="64999999999"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Texto do Botão (opcional)
                      </label>
                      <input
                        type="text"
                        value={editingBanner.buttonText || ""}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            buttonText: e.target.value,
                          })
                        }
                        placeholder="Ex: Simular no WhatsApp"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mensagem Pronta
                      </label>
                      <input
                        type="text"
                        value={editingBanner.whatsappMessage || ""}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            whatsappMessage: e.target.value,
                          })
                        }
                        placeholder="Olá! Vi o banner no Caldas Novas Online..."
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Link de Destino *
                      </label>
                      <input
                        type="text"
                        value={editingBanner.linkUrl || ""}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            linkUrl: e.target.value,
                          })
                        }
                        placeholder="https://... ou /empresa/slug"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Texto do Botão (opcional)
                      </label>
                      <input
                        type="text"
                        value={editingBanner.buttonText || ""}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            buttonText: e.target.value,
                          })
                        }
                        placeholder="Ex: Saiba Mais"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEditBanner}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#0A4D9C] hover:bg-[#062F63] text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                {savingEditBanner ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PLANO */}
      {editingPlan && (
        <div
          onClick={() => setEditingPlan(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSavePlan}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                Configurar Plano: {editingPlan.name || "Novo Plano"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, name: e.target.value })
                  }
                  placeholder="Ex: Vitrine, Destaque, Master"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtítulo Curto
                </label>
                <input
                  type="text"
                  value={editingPlan.subtitle}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, subtitle: e.target.value })
                  }
                  placeholder="Ex: + Fotos e Vídeos"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor (R$) — 0 para Grátis
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={editingPlan.price}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Período / Cobrança
                </label>
                <input
                  type="text"
                  value={editingPlan.billingPeriod}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      billingPeriod: e.target.value,
                    })
                  }
                  placeholder="/mês ou Grátis para sempre"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade de Fotos *
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={editingPlan.maxPhotos}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      maxPhotos: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade de Vídeos (0 a 4) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  required
                  value={editingPlan.maxVideos}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      maxVideos: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selo do Card (opcional)
                </label>
                <input
                  type="text"
                  value={editingPlan.badgeText || ""}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      badgeText: e.target.value,
                    })
                  }
                  placeholder="Ex: Mais Escolhido"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ordem (Vazio ou 0 = Aleatório • 1, 2, 3 = Fixo)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editingPlanOrderInput}
                  onChange={(e) =>
                    setEditingPlanOrderInput(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0 (Aleatório)"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.hasFeaturedHome}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        hasFeaturedHome: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#0A4D9C]"
                  />
                  Empresas em Destaque na Home
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.hasBannerHome}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        hasBannerHome: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#0A4D9C]"
                  />
                  Full Banner na Home
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.hasBannerSegment}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        hasBannerSegment: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#0A4D9C]"
                  />
                  Full Banner no Segmento
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-50 p-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.highlight}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        highlight: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#FF7A00]"
                  />
                  Destacar Card (Borda Laranja)
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Benefícios Extras (1 por linha)
                </label>
                <textarea
                  rows={4}
                  value={editingPlanFeaturesText}
                  onChange={(e) => setEditingPlanFeaturesText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingPlan}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#0A4D9C] hover:bg-[#062F63] text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                {savingPlan ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Plano
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DA CATEGORIA */}
      {editingCat && (
        <div
          onClick={() => setEditingCat(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveEditedCategory}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 relative my-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                Editar Categoria: {editingCat.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={editingCat.name}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Posição (1 a {categories.length})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editingCatOrderInput}
                  onChange={(e) =>
                    setEditingCatOrderInput(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="1"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtítulo / Descrição curta
                </label>
                <input
                  type="text"
                  value={editingCat.subtitle || ""}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, subtitle: e.target.value })
                  }
                  placeholder="Ex: Restaurantes, pizzarias, lanchonetes..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Temas Rápidos do Segmento (separados por vírgula — opcional)
                </label>
                <input
                  type="text"
                  value={editingCatQuickTagsText}
                  onChange={(e) => setEditingCatQuickTagsText(e.target.value)}
                  placeholder="Ex: Pizzarias, Hambúrguer, Restaurantes, Sushi"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Aparecem como botões de atalho abaixo da busca dentro deste segmento. Deixe vazio se não quiser atalhos.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cor do Card / Ícone
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        setEditingCat({ ...editingCat, bgColor: c.value })
                      }
                      className={`w-8 h-8 rounded-xl ${c.value} transition cursor-pointer ${
                        editingCat.bgColor === c.value
                          ? "ring-4 ring-slate-900 scale-110"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Foto ou Ícone Personalizado da Categoria
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl ${
                      editingCat.bgColor || "bg-blue-600"
                    } flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <CategoryIcon
                      name={editingCat.iconName}
                      customIconUrl={editingCat.customIconUrl}
                      className="w-7 h-7 text-white"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer">
                      {uploadingCatIcon ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Enviar Foto/Ícone
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadCategoryImage}
                        className="hidden"
                      />
                    </label>

                    {editingCat.customIconUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingCat({ ...editingCat, customIconUrl: "" })
                        }
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Usar ícone padrão
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingCat}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#0A4D9C] hover:bg-[#062F63] text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                {savingCat ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Categoria
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE UTILIDADE RÁPIDA */}
      {editingUtil && (
        <div
          onClick={() => setEditingUtil(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveEditedUtility}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 relative"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                Editar Utilidade: {editingUtil.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUtil(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Serviço / Órgão *
                </label>
                <input
                  type="text"
                  required
                  value={editingUtil.name}
                  onChange={(e) =>
                    setEditingUtil({ ...editingUtil, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone para Discagem *
                </label>
                <input
                  type="text"
                  required
                  value={editingUtil.number}
                  onChange={(e) =>
                    setEditingUtil({ ...editingUtil, number: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ordem de Exibição
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editingUtilOrderInput}
                  onChange={(e) =>
                    setEditingUtilOrderInput(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="1"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cor do Ícone
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        setEditingUtil({ ...editingUtil, color: c.value })
                      }
                      className={`w-8 h-8 rounded-xl ${c.value} transition cursor-pointer ${
                        editingUtil.color === c.value
                          ? "ring-4 ring-slate-900 scale-110"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Foto ou Ícone Personalizado
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl ${
                      editingUtil.color || "bg-blue-600"
                    } flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <CategoryIcon
                      name={editingUtil.iconName}
                      customIconUrl={editingUtil.customIconUrl}
                      className="w-7 h-7 text-white"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer">
                      {uploadingUtilIcon ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Enviar Foto/Ícone
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadUtilityImage}
                        className="hidden"
                      />
                    </label>

                    {editingUtil.customIconUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingUtil({ ...editingUtil, customIconUrl: "" })
                        }
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Usar ícone padrão
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUtil(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingUtil}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#0A4D9C] hover:bg-[#062F63] text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                {savingUtil ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Utilidade
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer settings={settings} />
    </div>
  );
}
