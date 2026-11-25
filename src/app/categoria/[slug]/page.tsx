"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { compressAndUploadImage } from "@/lib/cloudinary";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PLANS,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_BUSINESS_HOURS,
  WEEK_DAYS,
} from "@/lib/constants";
import {
  Business,
  BusinessHours,
  CategoryDoc,
  DayKey,
  PlanDoc,
  SiteSettings,
} from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Store,
  Upload,
  Loader2,
  LogOut,
  Save,
  Trash2,
  MapPin,
  Ticket,
  Youtube,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  EyeOff,
  MessageCircle,
  Lock,
  Building2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  X,
  Sparkles,
  Star,
  Megaphone,
  FileEdit,
  Copy,
  Plus,
  FolderKanban,
} from "lucide-react";

type ExtendedBusinessDoc = Business & {
  id: string;
  cep?: string;
  googleMapsUrl?: string;
  showAddressOnSite?: boolean;
  acceptedTerms?: boolean;
};

type ExtendedPlanDoc = PlanDoc & {
  priceDisplay?: string;
};

function createSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

function isValidYoutubeUrl(url: string): boolean {
  if (!url.trim()) return true;
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url.trim());
}

function formatPlanPrice(plan: ExtendedPlanDoc): string {
  if (!plan.price || plan.price <= 0) return "Grátis";
  if (plan.priceDisplay && plan.priceDisplay.trim()) {
    const raw = plan.priceDisplay.trim();
    return raw.startsWith("R$") ? raw : `R$ ${raw}`;
  }
  if (Number.isInteger(plan.price)) {
    return `R$ ${plan.price.toLocaleString("pt-BR")}`;
  }
  return plan.price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function BusinessDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerCompanyName, setRegisterCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Aba interna do Painel da Empresa (Editar Página vs Planos & Visibilidade)
  const [panelTab, setPanelTab] = useState<"edit" | "plans">("edit");

  const [categories, setCategories] = useState<CategoryDoc[]>(DEFAULT_CATEGORIES);
  const [plans, setPlans] = useState<ExtendedPlanDoc[]>(DEFAULT_PLANS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Lista de todas as empresas/anúncios vinculados a esta conta
  const [userBusinesses, setUserBusinesses] = useState<ExtendedBusinessDoc[]>([]);
  const [isCreatingNewAd, setIsCreatingNewAd] = useState(false);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Status de aprovação e Pop-up pós-salvamento
  const [isApproved, setIsApproved] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [fastTrackClicked, setFastTrackClicked] = useState(false);

  // Campos da Empresa / Anúncio ativo
  const [name, setName] = useState("");
  const [category, setCategory] = useState("onde-comer");
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [cep, setCep] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [showAddressOnSite, setShowAddressOnSite] = useState(true);
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [showcaseUrl, setShowcaseUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);

  // Horário de Funcionamento
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    DEFAULT_BUSINESS_HOURS
  );

  // Limites controlados pelo Master
  const [maxCategories, setMaxCategories] = useState(1);
  const [maxPhotos, setMaxPhotos] = useState(
    DEFAULT_PLANS.find((p) => p.id === "gratis")?.maxPhotos ?? 6
  );
  const [maxVideos, setMaxVideos] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [whatsappClicks, setWhatsappClicks] = useState(0);

  // Vídeos YouTube (Exclusivo Assinantes)
  const [youtubeHorizontal, setYoutubeHorizontal] = useState("");
  const [youtubeVertical1, setYoutubeVertical1] = useState("");
  const [youtubeVertical2, setYoutubeVertical2] = useState("");
  const [youtubeVertical3, setYoutubeVertical3] = useState("");

  // Cupom
  const [couponActive, setCouponActive] = useState(false);
  const [couponTitle, setCouponTitle] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponRules, setCouponRules] = useState("");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingShowcase, setUploadingShowcase] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const freePlanMaxPhotos =
    plans.find((p) => p.id === "gratis")?.maxPhotos ?? 6;

  function applyBusinessToForm(data: ExtendedBusinessDoc) {
    setIsCreatingNewAd(false);
    setBusinessId(data.id);
    setName(data.name || "");

    const primaryCat = data.category || "onde-comer";
    const allowedCats = Math.max(1, data.maxCategories ?? 1);
    const savedExtras = Array.isArray(data.categories)
      ? data.categories.filter((c) => c && c !== primaryCat)
      : [];

    setCategory(primaryCat);
    setMaxCategories(allowedCats);
    setExtraCategories(savedExtras.slice(0, Math.max(0, allowedCats - 1)));

    setSubcategory(data.subcategory || "");
    setDescription(data.description || "");
    setCep(formatCep(data.cep || ""));
    setNeighborhood(data.neighborhood || "");
    setAddress(data.address || "");
    setGoogleMapsUrl(data.googleMapsUrl || "");
    setShowAddressOnSite(data.showAddressOnSite !== false);
    setWhatsapp(data.whatsapp || "");
    setInstagram(data.instagram || "");
    setWebsite(data.website || "");
    setLogoUrl(data.logoUrl || "");
    setShowcaseUrl(data.showcaseUrl || "");
    setCoverUrl(data.coverUrl || "");
    setGallery(data.gallery || []);
    setMaxPhotos(data.maxPhotos ?? freePlanMaxPhotos);
    setMaxVideos(data.maxVideos ?? 0);
    setIsApproved(Boolean(data.isApproved));
    setIsFeatured(Boolean(data.isFeatured));
    setAcceptedTerms(Boolean(data.acceptedTerms ?? data.isApproved));
    setViewsCount(data.viewsCount || 0);
    setWhatsappClicks(data.whatsappClicks || 0);

    if (data.businessHours) {
      setBusinessHours({
        enabled: Boolean(data.businessHours.enabled),
        is24h: Boolean(data.businessHours.is24h),
        days: {
          ...DEFAULT_BUSINESS_HOURS.days,
          ...(data.businessHours.days || {}),
        },
      });
    } else {
      setBusinessHours(DEFAULT_BUSINESS_HOURS);
    }

    setYoutubeHorizontal(data.youtubeHorizontal || "");
    const verts = data.youtubeVerticals || [];
    setYoutubeVertical1(verts[0] || "");
    setYoutubeVertical2(verts[1] || "");
    setYoutubeVertical3(verts[2] || "");

    setCouponActive(Boolean(data.coupon?.active));
    setCouponTitle(data.coupon?.title || "");
    setCouponCode(data.coupon?.code || "");
    setCouponRules(data.coupon?.rules || "");
  }

  function handleStartNewAd() {
    const defaultCat = categories[0]?.slug || categories[0]?.id || "onde-comer";
    setIsCreatingNewAd(true);
    setPanelTab("edit");
    setBusinessId(null);
    setName("");
    setCategory(defaultCat);
    setExtraCategories([]);
    setMaxCategories(1);
    setSubcategory("");
    setDescription("");
    setCep("");
    setNeighborhood("");
    setAddress("");
    setGoogleMapsUrl("");
    setShowAddressOnSite(true);
    setWhatsapp("");
    setInstagram("");
    setWebsite("");
    setLogoUrl("");
    setShowcaseUrl("");
    setCoverUrl("");
    setGallery([]);
    setBusinessHours(DEFAULT_BUSINESS_HOURS);
    setMaxPhotos(freePlanMaxPhotos);
    setMaxVideos(0);
    setIsApproved(false);
    setIsFeatured(false);
    setAcceptedTerms(false);
    setViewsCount(0);
    setWhatsappClicks(0);
    setYoutubeHorizontal("");
    setYoutubeVertical1("");
    setYoutubeVertical2("");
    setYoutubeVertical3("");
    setCouponActive(false);
    setCouponTitle("");
    setCouponCode("");
    setCouponRules("");
  }

  useEffect(() => {
    async function loadShared() {
      try {
        const snapCats = await getDocs(collection(db, "categories"));
        if (!snapCats.empty) {
          const list = snapCats.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<CategoryDoc, "id">) }))
            .filter((c) => c.active !== false && (c.slug || c.id) !== "utilidades")
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (list.length > 0) setCategories(list);
        }

        const snapPlans = await getDocs(collection(db, "plans"));
        if (!snapPlans.empty) {
          const firestorePlansMap = new Map<string, ExtendedPlanDoc>();
          snapPlans.docs.forEach((d) => {
            firestorePlansMap.set(d.id, {
              id: d.id,
              ...(d.data() as Omit<ExtendedPlanDoc, "id">),
            });
          });

          const mergedPlansMap = new Map<string, ExtendedPlanDoc>();
          DEFAULT_PLANS.forEach((def) => {
            mergedPlansMap.set(def.id, firestorePlansMap.get(def.id) || def);
          });
          firestorePlansMap.forEach((val, key) => {
            if (!mergedPlansMap.has(key)) {
              mergedPlansMap.set(key, val);
            }
          });

          const activePlans = Array.from(mergedPlansMap.values())
            .filter((p) => p.active !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          if (activePlans.length > 0) setPlans(activePlans);
        }

        const snapSet = await getDoc(doc(db, "settings", "global"));
        if (snapSet.exists()) {
          setSettings((prev) => ({
            ...prev,
            ...(snapSet.data() as Partial<SiteSettings>),
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadShared();

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserBusinesses(currentUser.uid);
      } else {
        setUserBusinesses([]);
        setBusinessId(null);
      }
      setLoadingAuth(false);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUserBusinesses(uid: string, preferredSelectId?: string) {
    try {
      const q = query(collection(db, "businesses"), where("ownerId", "==", uid));
      const snap = await getDocs(q);
      const list: ExtendedBusinessDoc[] = snap.docs
        .map((d) => ({
          ...(d.data() as Omit<ExtendedBusinessDoc, "id">),
          id: d.id,
        }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      setUserBusinesses(list);

      if (list.length > 0) {
        const selected =
          (preferredSelectId && list.find((item) => item.id === preferredSelectId)) ||
          list[0];
        applyBusinessToForm(selected);
      } else {
        handleStartNewAd();
      }
    } catch (err) {
      console.error("Erro ao carregar empresas da conta:", err);
    }
  }

  const handlePrimaryCategoryChange = (newPrimarySlug: string) => {
    setCategory(newPrimarySlug);
    setExtraCategories((prev) => prev.filter((c) => c !== newPrimarySlug));
  };

  const handleToggleExtraCategory = (catSlug: string) => {
    const maxExtrasAllowed = Math.max(0, maxCategories - 1);
    if (maxExtrasAllowed <= 0) return;

    setExtraCategories((prev) => {
      if (prev.includes(catSlug)) {
        return prev.filter((c) => c !== catSlug);
      }
      if (prev.length >= maxExtrasAllowed) {
        alert(
          `Seu plano atual permite escolher até ${maxCategories} categorias no total (1 principal + ${maxExtrasAllowed} extra${
            maxExtrasAllowed > 1 ? "s" : ""
          }).`
        );
        return prev;
      }
      return [...prev, catSlug];
    });
  };

  const handleCepChange = async (rawValue: string) => {
    const formatted = formatCep(rawValue);
    setCep(formatted);

    const cleanCep = formatted.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.logradouro && !address.trim()) {
            setAddress(`${data.logradouro}, `);
          }
        }
      } catch {
        console.error("Erro ao buscar CEP");
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleUpdateDaySchedule = (
    dayKey: DayKey,
    field: "open" | "start" | "end",
    value: boolean | string
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [dayKey]: {
          ...prev.days[dayKey],
          [field]: value,
        },
      },
    }));
  };

  const handleCopyMondayToWeekdays = () => {
    const monday = businessHours.days.seg;
    setBusinessHours((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        ter: { ...monday },
        qua: { ...monday },
        qui: { ...monday },
        sex: { ...monday },
      },
    }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setSubmittingAuth(true);

    try {
      if (isForgotMode) {
        await sendPasswordResetEmail(auth, email);
        setAuthSuccess("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      } else if (isRegisterMode) {
        if (!registerCompanyName.trim()) {
          setAuthError("Por favor, informe o nome da sua empresa.");
          setSubmittingAuth(false);
          return;
        }
        const defaultCat = categories[0]?.slug || categories[0]?.id || "onde-comer";
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const slug = `${createSlug(registerCompanyName)}-${cred.user.uid.slice(0, 5)}`;
        const initialPayload: ExtendedBusinessDoc = {
          id: slug,
          ownerId: cred.user.uid,
          name: registerCompanyName.trim(),
          slug,
          category: defaultCat,
          categories: [defaultCat],
          subcategory: "",
          description: "Bem-vindo à nossa empresa no Caldas Novas Online!",
          cep: "",
          neighborhood: "Centro",
          address: "",
          googleMapsUrl: "",
          showAddressOnSite: true,
          lat: null,
          lng: null,
          whatsapp: "",
          logoUrl: "",
          showcaseUrl: "",
          coverUrl: "",
          gallery: [],
          businessHours: DEFAULT_BUSINESS_HOURS,
          maxCategories: 1,
          maxPhotos: freePlanMaxPhotos,
          maxVideos: 0,
          youtubeHorizontal: "",
          youtubeVerticals: [],
          coupon: { active: false, title: "", code: "", rules: "" },
          isVerified: true,
          isFeatured: false,
          isApproved: false,
          acceptedTerms: false,
          viewsCount: 0,
          whatsappClicks: 0,
          createdAt: Date.now(),
        };
        await setDoc(doc(db, "businesses", slug), initialPayload);
        setUserBusinesses([initialPayload]);
        applyBusinessToForm(initialPayload);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch {
      if (isForgotMode) {
        setAuthError("Não foi possível enviar o e-mail. Verifique se o endereço está correto.");
      } else {
        setAuthError(
          isRegisterMode
            ? "Erro ao cadastrar. E-mail já em uso ou senha com menos de 6 caracteres."
            : "E-mail ou senha incorretos."
        );
      }
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleUploadSingle = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "logo" | "showcase" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === "logo") setUploadingLogo(true);
    else if (target === "showcase") setUploadingShowcase(true);
    else setUploadingCover(true);

    try {
      const url = await compressAndUploadImage(file);
      if (target === "logo") setLogoUrl(url);
      else if (target === "showcase") setShowcaseUrl(url);
      else setCoverUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      if (target === "logo") setUploadingLogo(false);
      else if (target === "showcase") setUploadingShowcase(false);
      else setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleUploadGalleryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (gallery.length >= maxPhotos) {
      alert(`Você atingiu o limite de ${maxPhotos} fotos do seu plano.`);
      e.target.value = "";
      return;
    }

    setUploadingGallery(true);
    try {
      const url = await compressAndUploadImage(file);
      setGallery((prev) => [...prev, url]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleRemoveGalleryPhoto = (idx: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !whatsapp.trim() || !neighborhood.trim() || !address.trim()) {
      alert("Preencha os campos obrigatórios (Nome, WhatsApp, Bairro e Endereço) antes de salvar.");
      return;
    }

    if (!acceptedTerms) {
      alert("Você precisa marcar a caixa concordando com as Regras e Termos de Responsabilidade do Guia.");
      return;
    }

    const allVideoInputs = [
      youtubeHorizontal,
      youtubeVertical1,
      youtubeVertical2,
      youtubeVertical3,
    ];
    for (const link of allVideoInputs) {
      if (!isValidYoutubeUrl(link)) {
        alert("Atenção: Aceitamos apenas links do YouTube (youtube.com ou youtu.be).");
        return;
      }
    }

    setSaving(true);
    try {
      const allowedVerticalCount = Math.max(0, maxVideos - 1);
      const verticalVideos = [youtubeVertical1, youtubeVertical2, youtubeVertical3]
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, allowedVerticalCount);

      const finalMaxPhotos = Math.max(1, maxPhotos || freePlanMaxPhotos);
      const finalMaxCategories = Math.max(1, maxCategories || 1);
      const allSelectedCategories = Array.from(
        new Set([
          category,
          ...extraCategories
            .filter((c) => c && c !== category)
            .slice(0, Math.max(0, finalMaxCategories - 1)),
        ])
      );

      const payload = {
        ownerId: user.uid,
        name: name.trim(),
        category,
        categories: allSelectedCategories,
        subcategory: subcategory.trim(),
        description: description.trim(),
        cep: formatCep(cep),
        neighborhood: neighborhood.trim(),
        address: address.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        showAddressOnSite,
        whatsapp: whatsapp.replace(/\D/g, ""),
        instagram: instagram.trim(),
        website: website.trim(),
        logoUrl,
        showcaseUrl,
        coverUrl,
        gallery: gallery.slice(0, finalMaxPhotos),
        businessHours,
        maxCategories: finalMaxCategories,
        maxPhotos: finalMaxPhotos,
        maxVideos,
        youtubeHorizontal: maxVideos >= 1 ? youtubeHorizontal.trim() : "",
        youtubeVerticals: verticalVideos,
        acceptedTerms: true,
        acceptedTermsAt: Date.now(),
        coupon: {
          active: couponActive,
          title: couponTitle.trim(),
          code: couponCode.trim().toUpperCase(),
          rules: couponRules.trim(),
        },
      };

      let savedDocId = businessId;

      if (businessId && !isCreatingNewAd) {
        await updateDoc(doc(db, "businesses", businessId), payload);
      } else {
        const uniqueSuffix = `${user.uid.slice(0, 4)}-${Date.now().toString(36).slice(-4)}`;
        const newSlug = `${createSlug(name)}-${uniqueSuffix}`;
        await setDoc(doc(db, "businesses", newSlug), {
          ...payload,
          slug: newSlug,
          lat: null,
          lng: null,
          isVerified: true,
          isFeatured: false,
          isApproved: false,
          viewsCount: 0,
          whatsappClicks: 0,
          createdAt: Date.now(),
        });
        savedDocId = newSlug;
        setBusinessId(newSlug);
        setIsCreatingNewAd(false);
        setIsApproved(false);
      }

      if (savedDocId) {
        await loadUserBusinesses(user.uid, savedDocId);
      }

      if (!isApproved) {
        setFastTrackClicked(false);
        setShowApprovalModal(true);
      } else {
        alert("✅ Alterações salvas e atualizadas na sua página!");
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "verifique sua conexão.";
      alert("Erro ao salvar dados da empresa: " + errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseApprovalModal = () => {
    setShowApprovalModal(false);
    setFastTrackClicked(false);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A4D9C]" />
      </div>
    );
  }

  // TELA DE LOGIN / CADASTRO / ESQUECI SENHA
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar vipGroupUrl={settings.vipGroupUrl} masterWhatsApp={settings.masterWhatsApp} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 max-w-md w-full p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#0A4D9C] text-white flex items-center justify-center mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              {isForgotMode
                ? "Recuperar Senha"
                : isRegisterMode
                ? "Cadastrar Minha Empresa"
                : "Área da Empresa"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isForgotMode
                ? "Digite seu e-mail cadastrado para receber o link de redefinição."
                : isRegisterMode
                ? "Crie sua conta e gerencie uma ou várias empresas/anúncios no mesmo acesso."
                : "Acesse sua conta para gerenciar seus anúncios no Caldas Novas Online."}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Primeira Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerCompanyName}
                    onChange={(e) => setRegisterCompanyName(e.target.value)}
                    placeholder="Ex: Hotel Caldas Plaza"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@suaempresa.com.br"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              {!isForgotMode && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Senha (mínimo 6 caracteres) *
                    </label>
                    {!isRegisterMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotMode(true);
                          setAuthError("");
                          setAuthSuccess("");
                        }}
                        className="text-xs font-bold text-[#0A4D9C] hover:underline"
                      >
                        Esqueci a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {authError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
                  {authError}
                </p>
              )}

              {authSuccess && (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl">
                  {authSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingAuth}
                className="w-full bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-sm py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {submittingAuth && <Loader2 className="w-4 h-4 animate-spin" />}
                {isForgotMode
                  ? "Enviar E-mail de Recuperação"
                  : isRegisterMode
                  ? "Criar Conta e Empresa"
                  : "Entrar no Painel"}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-2">
              {isForgotMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="text-xs font-bold text-[#0A4D9C] hover:underline block w-full"
                >
                  Voltar para o Login
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="text-xs font-bold text-[#0A4D9C] hover:underline block w-full"
                >
                  {isRegisterMode
                    ? "Já tem cadastro? Fazer login"
                    : "Ainda não tem conta? Cadastre sua empresa"}
                </button>
              )}
            </div>
          </div>
        </main>
        <Footer settings={settings} />
      </div>
    );
  }

  const cleanMasterPhone = (settings.masterWhatsApp || "5564993049090").replace(/\D/g, "");

  const fastTrackApprovalWaUrl = `https://wa.me/${cleanMasterPhone}?text=${encodeURIComponent(
    `Olá! A empresa "${name || "Nova Empresa"}" acabou de se cadastrar no guia Caldas Novas Online e solicita a verificação e liberação da página.`
  )}`;

  const multiCategoryWaUrl = `https://wa.me/${cleanMasterPhone}?text=${encodeURIComponent(
    `Olá! Sou da empresa "${name || "cadastrada"}" no Caldas Novas Online e quero anunciar em 2 ou mais categorias ao mesmo tempo.`
  )}`;

  const unlockedVerticalVideos = Math.max(0, maxVideos - 1);
  const maxExtrasAllowed = Math.max(0, maxCategories - 1);
  const availableExtraCategories = categories.filter(
    (c) => (c.slug || c.id) !== category
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar vipGroupUrl={settings.vipGroupUrl} masterWhatsApp={settings.masterWhatsApp} />

      <main className="max-w-5xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* SELETOR MULTI-ANÚNCIOS / MULTI-EMPRESAS DA MESMA CONTA */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {userBusinesses.map((item, idx) => {
              const isSelected = !isCreatingNewAd && item.id === businessId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyBusinessToForm(item)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
                    isSelected
                      ? "bg-[#0A4D9C] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.isApproved ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <span className="truncate max-w-[170px]">
                    {item.name || `Anúncio ${idx + 1}`}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleStartNewAd}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer ${
                isCreatingNewAd
                  ? "bg-[#FF7A00] text-slate-950 shadow-xs"
                  : "bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Anúncio
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 px-1">
            {userBusinesses.length} {userBusinesses.length === 1 ? "empresa vinculada" : "empresas vinculadas"}
          </span>
        </div>

        {/* Topo do Painel com Nome da Empresa Selecionada e Status de Publicação */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0A4D9C] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isCreatingNewAd ? "Cadastrando Novo Anúncio" : "Empresa Selecionada"}
                </p>
                {isCreatingNewAd ? (
                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    <Plus className="w-3 h-3" /> Novo Cadastro
                  </span>
                ) : isApproved ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Publicada no Guia
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> Em Análise (Aguardando Liberação)
                  </span>
                )}
                {isFeatured && !isCreatingNewAd && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-[#FFB800] text-[#FFB800]" /> Destaque VIP
                  </span>
                )}
              </div>
              <h1 className="text-xl font-black text-slate-900">
                {name || (isCreatingNewAd ? "Nova Empresa / Filial" : "Minha Empresa")}
              </h1>
              <p className="text-xs text-slate-500">
                Pacote atual:{" "}
                <strong>
                  {maxCategories}{" "}
                  {maxCategories === 1 ? "categoria" : "categorias"}
                </strong>
                , <strong>{maxPhotos} fotos</strong> e{" "}
                <strong>{maxVideos} vídeo(s)</strong> liberados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {businessId && isApproved && !isCreatingNewAd && (
              <Link
                href={`/empresa/${businessId}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-[#0A4D9C] px-3.5 py-2.5 rounded-xl hover:bg-blue-100"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ver Minha Página
              </Link>
            )}
            <button
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        {/* Aviso caso esteja pendente de aprovação */}
        {!isApproved && !isCreatingNewAd && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-amber-950">
                  Seu cadastro passa por uma verificação de segurança antes de ir ao ar
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Preencha seus dados abaixo, aceite as regras e salve. O prazo de liberação é de até 48h (ou solicite agilidade no WhatsApp).
                </p>
              </div>
            </div>
            <a
              href={fastTrackApprovalWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 shrink-0 transition"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Acelerar Liberação
            </a>
          </div>
        )}

        {/* Métricas + Chamada Discreta para Planos */}
        {businessId && !isCreatingNewAd && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A4D9C] flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Visitas na Página</p>
                <p className="text-xl font-black text-slate-900">{viewsCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Cliques no WhatsApp</p>
                <p className="text-xl font-black text-slate-900">{whatsappClicks}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPanelTab("plans")}
              className="col-span-2 sm:col-span-1 bg-gradient-to-r from-[#FF7A00] to-[#FFB800] rounded-2xl p-4 text-slate-950 shadow-sm flex flex-col justify-center text-left hover:opacity-95 transition cursor-pointer"
            >
              <p className="text-xs font-black uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Quer mais visibilidade?
              </p>
              <p className="text-xs font-semibold mt-0.5">
                Veja os planos com + categorias, fotos e vídeos →
              </p>
            </button>
          </div>
        )}

        {/* ABAS INTERNAS: EDITAR PÁGINA vs PLANOS & VISIBILIDADE */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPanelTab("edit")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              panelTab === "edit"
                ? "bg-[#0A4D9C] text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <FileEdit className="w-4 h-4" />
            Dados da Minha Página
          </button>

          <button
            type="button"
            onClick={() => setPanelTab("plans")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              panelTab === "plans"
                ? "bg-[#FF7A00] text-slate-950 shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Planos & Visibilidade
          </button>
        </div>

        {/* ABA 1: FORMULÁRIO DE EDIÇÃO DA EMPRESA */}
        {panelTab === "edit" && (
          <form onSubmit={handleSaveBusiness} noValidate className="space-y-6">
            {/* 1. DADOS PRINCIPAIS */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
              <h2 className="font-extrabold text-slate-900">1. Informações da Empresa / Anúncio</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Pizzaria Sabor das Águas"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Segmento / Categoria Principal *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug || cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CATEGORIAS EXTRAS (MULTI-CATEGORIAS CONFORME PLANO) */}
                <div className="sm:col-span-2 rounded-2xl bg-slate-50 border border-slate-200/90 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <FolderKanban className="w-4 h-4 text-purple-600" />
                        Categorias Extras (Aparecer em mais de um segmento)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {maxExtrasAllowed > 0
                          ? `Seu plano permite escolher até ${maxExtrasAllowed} categoria${
                              maxExtrasAllowed > 1 ? "s" : ""
                            } extra${
                              maxExtrasAllowed > 1 ? "s" : ""
                            } além da principal (${extraCategories.length}/${maxExtrasAllowed} selecionadas).`
                          : "No plano Grátis sua empresa aparece em 1 categoria. Quer aparecer em 2 ou mais segmentos (ex: Onde Comer + Sorveteria)?"}
                      </p>
                    </div>

                    {maxCategories < 3 && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPanelTab("plans")}
                          className="inline-flex items-center gap-1 bg-[#FF7A00] hover:bg-orange-500 text-slate-950 font-extrabold text-[11px] px-3 py-2 rounded-xl shadow-2xs transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Ver Planos
                        </button>

                        <a
                          href={multiCategoryWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-[11px] px-3 py-2 rounded-xl shadow-2xs transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          Falar no WhatsApp
                        </a>
                      </div>
                    )}
                  </div>

                  {maxExtrasAllowed > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableExtraCategories.map((cat) => {
                        const catSlug = cat.slug || cat.id;
                        const isChecked = extraCategories.includes(catSlug);
                        const isDisabled =
                          !isChecked &&
                          extraCategories.length >= maxExtrasAllowed;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleToggleExtraCategory(catSlug)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition ${
                              isChecked
                                ? "bg-purple-600 text-white border-purple-600 shadow-2xs cursor-pointer"
                                : isDisabled
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                : "bg-white hover:bg-purple-50 text-slate-700 border-slate-300 cursor-pointer"
                            }`}
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Multi-categorias disponível nos planos pagos — clique em{" "}
                        <strong className="text-slate-600">&quot;Ver Planos&quot;</strong> ou{" "}
                        <strong className="text-slate-600">&quot;Falar no WhatsApp&quot;</strong> para liberar.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Especialidade / Subcategoria
                  </label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Ex: Pizzaria e Esfiharia"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp para Clientes (com DDD) *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="64999999999"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      CEP (Preenche automático)
                    </label>
                    {loadingCep && (
                      <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Buscando CEP...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={cep}
                    maxLength={9}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="75681-648"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Centro / Turista I"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Endereço Completo (Rua, Número / Quadra, Lote) *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Av. Coronel Bento de Godoy, 120"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link do Google Maps da Empresa (opcional — libera o botão &quot;Localização&quot; no site)
                  </label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                    <input
                      type="url"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      placeholder="Cole aqui o link do Google Maps (ex: https://maps.app.goo.gl/...)"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                {/* CONTROLE ESTRATÉGICO DE PRIVACIDADE DO ENDEREÇO NO SITE */}
                <div className="sm:col-span-2 rounded-2xl bg-slate-50 border border-slate-200/90 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0A4D9C]" />
                      Exibir endereço e localização publicamente no site?
                    </p>
                    <p className="text-[11px] text-slate-500">
                      O cadastro do endereço é obrigatório para validação interna, mas você pode ocultá-lo no site caso atenda somente online, delivery ou em domicílio.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAddressOnSite(true)}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        showAddressOnSite
                          ? "bg-[#0A4D9C] text-white shadow-xs"
                          : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Mostrar no Site
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressOnSite(false)}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        !showAddressOnSite
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Ocultar (Online / Domicílio)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instagram (opcional)
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/suaempresa"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Site / Cardápio Digital (opcional)
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição dos Serviços / Produtos *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Conte aos clientes o que sua empresa oferece..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. HORÁRIO DE FUNCIONAMENTO */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0A4D9C]" />
                  <div>
                    <h2 className="font-extrabold text-slate-900">
                      2. Horário de Funcionamento
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Mostra no anúncio se a loja está <strong>Aberta agora</strong> ou <strong>Fechada</strong> em tempo real
                    </p>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-800 cursor-pointer bg-blue-50 px-3.5 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={businessHours.enabled}
                    onChange={(e) =>
                      setBusinessHours({
                        ...businessHours,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#0A4D9C]"
                  />
                  Exibir Horário de Funcionamento
                </label>
              </div>

              {businessHours.enabled && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(businessHours.is24h)}
                        onChange={(e) =>
                          setBusinessHours({
                            ...businessHours,
                            is24h: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-emerald-600"
                      />
                      Atendimento 24 horas (todos os dias)
                    </label>

                    {!businessHours.is24h && (
                      <button
                        type="button"
                        onClick={handleCopyMondayToWeekdays}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A4D9C] hover:bg-blue-50 px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Replicar Segunda para Seg–Sex
                      </button>
                    )}
                  </div>

                  {!businessHours.is24h && (
                    <div className="space-y-2">
                      {WEEK_DAYS.map((day) => {
                        const sched = businessHours.days[day.key];
                        return (
                          <div
                            key={day.key}
                            className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                          >
                            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 min-w-[130px] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sched.open}
                                onChange={(e) =>
                                  handleUpdateDaySchedule(
                                    day.key,
                                    "open",
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 accent-[#0A4D9C]"
                              />
                              <span>{day.label}</span>
                            </label>

                            {sched.open ? (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-500 font-semibold">
                                  Abre:
                                </span>
                                <input
                                  type="time"
                                  value={sched.start}
                                  onChange={(e) =>
                                    handleUpdateDaySchedule(
                                      day.key,
                                      "start",
                                      e.target.value
                                    )
                                  }
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-800"
                                />
                                <span className="text-slate-500 font-semibold">
                                  Fecha:
                                </span>
                                <input
                                  type="time"
                                  value={sched.end}
                                  onChange={(e) =>
                                    handleUpdateDaySchedule(
                                      day.key,
                                      "end",
                                      e.target.value
                                    )
                                  }
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-800"
                                />
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-red-600 px-2">
                                Fechado neste dia
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. LOGOMARCA, FOTO VITRINE, BANNER CAPA E GALERIA */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#0A4D9C]" />
                  <h2 className="font-extrabold text-slate-900">
                    3. Logo, Foto Vitrine, Banner Capa e Galeria ({gallery.length}/{maxPhotos} fotos)
                  </h2>
                </div>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg">
                  Compressão automática • Máx. 1 MB final
                </span>
              </div>

              {/* 3 IDENTIDADES VISUAIS SEPARADAS (LOGO | FOTO VITRINE | BANNER CAPA) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. LOGOMARCA QUADRADA */}
                <div className="border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-slate-50/40">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="w-16 h-16 rounded-xl object-cover border bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">
                          Logo
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <p className="text-xs font-extrabold text-slate-900">
                          1. Logomarca Quadrada
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Tamanho: <strong>1024×1024px</strong> (1:1)
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Exibe no perfil da empresa
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700">
                      🤖 Melhor no GPT: <span className="text-[#0A4D9C]">Quadrada (1:1)</span>
                    </div>
                  </div>

                  <label className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-3 py-2 rounded-xl cursor-pointer transition">
                    {uploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#0A4D9C]" />
                    )}
                    {logoUrl ? "Trocar Logo" : "Enviar Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadSingle(e, "logo")}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 2. FOTO VITRINE (CARD DA HOME E CATEGORIAS) */}
                <div className="border-2 border-dashed border-[#0A4D9C]/40 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-blue-50/30">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      {showcaseUrl ? (
                        <img
                          src={showcaseUrl}
                          alt="Foto Vitrine"
                          className="w-20 h-14 rounded-xl object-cover border bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-14 rounded-xl bg-blue-100/70 flex items-center justify-center text-[11px] text-[#0A4D9C] font-extrabold shrink-0 text-center px-1">
                          Vitrine
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <p className="text-xs font-extrabold text-slate-900">
                          2. Foto Vitrine (Card)
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Tamanho: <strong>1536×1024px</strong> (3:2)
                        </p>
                        <p className="text-[10px] text-[#0A4D9C] font-semibold">
                          Capa do card na Home e Busca
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-blue-100/80 px-2.5 py-1.5 text-[10px] font-bold text-[#0A4D9C]">
                      🤖 Melhor no GPT: <span className="underline">Horizontal (3:2)</span>
                    </div>
                  </div>

                  <label className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-extrabold bg-[#0A4D9C] hover:bg-[#062F63] text-white px-3 py-2 rounded-xl cursor-pointer transition">
                    {uploadingShowcase ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {showcaseUrl ? "Trocar Foto Vitrine" : "Enviar Foto Vitrine"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadSingle(e, "showcase")}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 3. BANNER CAPA (TOPO DA PÁGINA INTERNA) */}
                <div className="border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-slate-50/40">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt="Banner Capa"
                          className="w-24 h-12 rounded-xl object-cover border bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[11px] text-slate-400 font-bold shrink-0">
                          Capa
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <p className="text-xs font-extrabold text-slate-900">
                          3. Banner Capa (Topo)
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Tamanho: <strong>1200×400px</strong> (3:1)
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Faixa panorâmica no topo da página
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700">
                      🤖 No GPT: <span className="text-[#0A4D9C]">Horizontal 3:1 panorâmico</span>
                    </div>
                  </div>

                  <label className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-3 py-2 rounded-xl cursor-pointer transition">
                    {uploadingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#0A4D9C]" />
                    )}
                    {coverUrl ? "Trocar Banner Capa" : "Enviar Banner Capa"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadSingle(e, "cover")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">
                      Fotos da Galeria ({gallery.length} de {maxPhotos} utilizadas)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      🤖 Melhor no GPT: <strong>Quadrada (1:1 • 1024×1024px)</strong> ou <strong>Vertical (2:3 • 1024×1536px)</strong> — aceita também fotos diretas do celular
                    </p>
                  </div>

                  {gallery.length < maxPhotos ? (
                    <label className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-[#0A4D9C] hover:bg-[#062F63] text-white px-3.5 py-2 rounded-xl cursor-pointer shrink-0 self-start sm:self-auto">
                      {uploadingGallery ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Adicionar Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadGalleryPhoto}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPanelTab("plans")}
                      className="text-xs font-bold text-[#FF7A00] hover:underline cursor-pointer"
                    >
                      Limite atingido • Liberar mais fotos
                    </button>
                  )}
                </div>

                {gallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {gallery.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={photo}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-36 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryPhoto(idx)}
                          className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1.5 rounded-lg shadow opacity-90 hover:opacity-100"
                          title="Remover foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. VÍDEOS DO YOUTUBE (EXCLUSIVO ASSINANTES) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-600" />
                  <h2 className="font-extrabold text-slate-900">
                    4. Vídeos do YouTube ({maxVideos} vídeo(s) liberados)
                  </h2>
                </div>

                {maxVideos < 4 && (
                  <button
                    type="button"
                    onClick={() => setPanelTab("plans")}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#FF7A00] hover:bg-orange-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition self-start sm:self-auto cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ver planos com vídeos
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vídeo Principal Horizontal (Exibe primeiro em destaque)
                </label>
                {maxVideos >= 1 ? (
                  <input
                    type="url"
                    value={youtubeHorizontal}
                    onChange={(e) => setYoutubeHorizontal(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                ) : (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Disponível a partir do Plano Vitrine — clique em &quot;Ver planos com vídeos&quot;
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Vídeos Verticais (YouTube Shorts — {unlockedVerticalVideos} de 3 liberados)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { num: 1, val: youtubeVertical1, set: setYoutubeVertical1 },
                    { num: 2, val: youtubeVertical2, set: setYoutubeVertical2 },
                    { num: 3, val: youtubeVertical3, set: setYoutubeVertical3 },
                  ].map((slot) => {
                    const isUnlocked = unlockedVerticalVideos >= slot.num;
                    return (
                      <div key={slot.num}>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Vídeo Vertical #{slot.num}
                        </label>
                        {isUnlocked ? (
                          <input
                            type="url"
                            value={slot.val}
                            onChange={(e) => slot.set(e.target.value)}
                            placeholder="https://youtube.com/shorts/..."
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                          />
                        ) : (
                          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> Exclusivo assinantes
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. CUPOM DE DESCONTO */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#FF7A00]" />
                  <h2 className="font-extrabold text-slate-900">
                    5. Cupom de Desconto Exclusivo
                  </h2>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={couponActive}
                    onChange={(e) => setCouponActive(e.target.checked)}
                    className="w-4 h-4 accent-[#FF7A00]"
                  />
                  Ativar Cupom na Minha Página
                </label>
              </div>

              {couponActive && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Oferta do Cupom (inclua % ou R$) *
                    </label>
                    <input
                      type="text"
                      required={couponActive}
                      value={couponTitle}
                      onChange={(e) => setCouponTitle(e.target.value)}
                      placeholder="Ex: 5% OFF na Hospedagem à vista"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Código do Cupom *
                    </label>
                    <input
                      type="text"
                      required={couponActive}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Ex: CALDAS05"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Regras (opcional)
                    </label>
                    <input
                      type="text"
                      value={couponRules}
                      onChange={(e) => setCouponRules(e.target.value)}
                      placeholder="Válido de domingo a quinta"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 6. REGRAS DO GUIA E TERMO DE RESPONSABILIDADE */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0A4D9C]" />
                <h2 className="font-extrabold text-slate-900">
                  6. Regras do Guia e Termo de Responsabilidade
                </h2>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-600 leading-relaxed space-y-1.5">
                <p>
                  <strong>1. Responsabilidade Integral:</strong> A empresa anunciante é 100% responsável pela veracidade das informações, preços, promoções, direitos de imagem e cumprimento dos cupons divulgados em sua página.
                </p>
                <p>
                  <strong>2. Conduta e Proibições:</strong> É estritamente proibido publicar conteúdo ofensivo, ilegal, pornográfico, enganoso ou sem atividade comercial ou prestação de serviços legítima.
                </p>
                <p>
                  <strong>3. Moderação e Penalidades:</strong> Todo cadastro passa por vistoria prévia. Em caso de violação destas regras, fraudes ou reclamações fundamentadas de consumidores, o anúncio poderá ser <strong>bloqueado ou excluído automaticamente sem aviso prévio e sem direito a reembolso</strong> de eventuais planos contratados.
                </p>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#0A4D9C] shrink-0"
                />
                <span className="text-xs font-bold text-slate-800">
                  Li, concordo com as regras do guia Caldas Novas Online e assumo total responsabilidade pelas informações e imagens publicadas. *
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-lg inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving
                ? "SALVANDO E ENVIANDO..."
                : isCreatingNewAd
                ? "CADASTRAR NOVO ANÚNCIO"
                : "SALVAR E ENVIAR PARA APROVAÇÃO"}
            </button>
          </form>
        )}

        {/* ABA 2: PLANOS & VISIBILIDADE (TABELA DE UPGRADE DO LOJISTA) */}
        {panelTab === "plans" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Aumente a visibilidade da {name || "sua empresa"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seu limite atual neste anúncio é de{" "}
                  <strong>
                    {maxCategories}{" "}
                    {maxCategories === 1 ? "categoria" : "categorias"}
                  </strong>
                  , <strong>{maxPhotos} fotos</strong> e{" "}
                  <strong>{maxVideos} vídeo(s)</strong>. Escolha um pacote abaixo para aparecer em mais categorias e liberar mais mídia.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPanelTab("edit")}
                className="text-xs font-bold text-[#0A4D9C] hover:underline shrink-0 cursor-pointer"
              >
                ← Voltar para edição
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {plans.map((plan) => {
                const isFree = !plan.price || plan.price <= 0;
                const isBannerOnlyPlan =
                  (plan.maxPhotos ?? 0) === 0 && (plan.maxVideos ?? 0) === 0;
                const isMasterOrPurple =
                  plan.id === "master" ||
                  plan.id.includes("banner") ||
                  isBannerOnlyPlan;
                const isOrangeHighlight =
                  Boolean(plan.highlight) && !isMasterOrPurple;
                const formattedPrice = formatPlanPrice(plan);
                const planCats = Math.max(1, Number(plan.maxCategories) || 1);

                const waMessage = `Olá! Sou da empresa *${
                  name || "cadastrada"
                }* no Caldas Novas Online e quero contratar o plano *${
                  plan.name
                }* (${formattedPrice}).`;
                const waUrl = `https://wa.me/${cleanMasterPhone}?text=${encodeURIComponent(
                  waMessage
                )}`;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl bg-white flex flex-col justify-between p-5 transition relative ${
                      isOrangeHighlight
                        ? "border-2 border-[#FF7A00] shadow-lg"
                        : isMasterOrPurple
                        ? "border-2 border-purple-500/80 shadow-md"
                        : "border border-slate-200/90 shadow-sm"
                    }`}
                  >
                    {plan.badgeText && (
                      <span
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs whitespace-nowrap ${
                          isOrangeHighlight
                            ? "bg-[#FF7A00] text-slate-950"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                        }`}
                      >
                        {plan.badgeText}
                      </span>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          {plan.name}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {plan.subtitle}
                        </p>
                      </div>

                      <div className="pt-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[#0A4D9C]">
                            {formattedPrice}
                          </span>
                          {!isFree && (
                            <span className="text-[11px] font-bold text-slate-500">
                              {plan.billingPeriod || "/mês"}
                            </span>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        {isBannerOnlyPlan ? (
                          <li className="flex items-start gap-1.5 font-extrabold text-purple-900 bg-purple-50 p-2 rounded-lg">
                            <Megaphone className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <span>Exclusivo Full Banner (sem página interna)</span>
                          </li>
                        ) : (
                          <>
                            <li className="flex items-start gap-1.5 font-bold text-slate-900">
                              <FolderKanban className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                              <span>
                                Até {planCats}{" "}
                                {planCats === 1 ? "categoria" : "categorias"}
                              </span>
                            </li>

                            <li className="flex items-start gap-1.5 font-bold text-slate-900">
                              <ImageIcon className="w-3.5 h-3.5 text-[#0A4D9C] shrink-0 mt-0.5" />
                              <span>Até {plan.maxPhotos} fotos</span>
                            </li>

                            <li className="flex items-start gap-1.5 font-bold text-slate-900">
                              <Youtube className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                              <span>
                                {plan.maxVideos > 0
                                  ? `Até ${plan.maxVideos} vídeo(s)`
                                  : "Sem vídeos"}
                              </span>
                            </li>
                          </>
                        )}

                        {plan.hasFeaturedHome && (
                          <li className="flex items-start gap-1.5 font-extrabold text-amber-800 bg-amber-50 p-1.5 rounded-lg">
                            <Star className="w-3.5 h-3.5 text-[#FFB800] fill-[#FFB800] shrink-0 mt-0.5" />
                            <span>Destaque na Home</span>
                          </li>
                        )}

                        {plan.hasBannerHome && (
                          <li className="flex items-start gap-1.5 font-extrabold text-[#0A4D9C] bg-blue-50 p-1.5 rounded-lg">
                            <Megaphone className="w-3.5 h-3.5 text-[#0A4D9C] shrink-0 mt-0.5" />
                            <span>Full Banner Home</span>
                          </li>
                        )}

                        {plan.hasBannerSegment && (
                          <li className="flex items-start gap-1.5 font-extrabold text-[#0A4D9C] bg-blue-50 p-1.5 rounded-lg">
                            <Megaphone className="w-3.5 h-3.5 text-[#FF7A00] shrink-0 mt-0.5" />
                            <span>Full Banner Segmento</span>
                          </li>
                        )}

                        {(plan.features || []).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {isFree ? (
                        <div className="w-full bg-slate-100 text-slate-500 font-extrabold text-[11px] py-2.5 px-3 rounded-xl text-center">
                          Plano Base Ativo
                        </div>
                      ) : (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full font-extrabold text-xs py-3 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-sm transition ${
                            isOrangeHighlight
                              ? "bg-[#1DB954] hover:bg-[#18a349] text-white"
                              : isMasterOrPurple
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                              : "bg-[#0A4D9C] hover:bg-[#062F63] text-white"
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
                          <span>Ativar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* POP-UP DE CADASTRO RECEBIDO / CONFIRMAÇÃO APÓS CLICAR NO WHATSAPP */}
      {showApprovalModal && (
        <div
          onClick={handleCloseApprovalModal}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-4 text-center"
          >
            <button
              type="button"
              onClick={handleCloseApprovalModal}
              aria-label="Fechar"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            {fastTrackClicked ? (
              <>
                <h3 className="text-xl font-black text-slate-900">
                  Obrigado! Já estamos organizando tudo
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Recebemos a solicitação da <strong>{name}</strong>! Nossa equipe já está priorizando a revisão do seu cadastro para colocar sua página no ar no <strong>Caldas Novas Online</strong> o mais rápido possível.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloseApprovalModal}
                    className="w-full bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-sm py-3.5 px-5 rounded-2xl shadow-md transition cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-black text-slate-900">
                  Cadastro Salvo com Sucesso!
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Os dados da empresa <strong>{name}</strong> foram enviados para a nossa equipe de moderação. Num prazo de até <strong>48 horas</strong> sua página estará publicada no guia <strong>Caldas Novas Online</strong>.
                </p>

                <div className="pt-2 space-y-2.5">
                  <a
                    href={fastTrackApprovalWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setFastTrackClicked(true)}
                    className="w-full bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-md inline-flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-5 h-5 fill-white" />
                    Clique aqui para acelerar sua publicação
                  </a>

                  <button
                    type="button"
                    onClick={handleCloseApprovalModal}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                  >
                    Entendi, aguardar análise
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer settings={settings} />
    </div>
  );
}
