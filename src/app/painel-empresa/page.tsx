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
import { DEFAULT_CATEGORIES, DEFAULT_SITE_SETTINGS } from "@/lib/constants";
import { Business, CategoryDoc, SiteSettings } from "@/types";
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
} from "lucide-react";

function createSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isValidYoutubeUrl(url: string): boolean {
  if (!url.trim()) return true;
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url.trim());
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

  const [categories, setCategories] = useState<CategoryDoc[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Campos da Empresa
  const [name, setName] = useState("");
  const [category, setCategory] = useState("alimentacao");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [cep, setCep] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);

  // Limites controlados pelo Master
  const [maxPhotos, setMaxPhotos] = useState(5);
  const [maxVideos, setMaxVideos] = useState(1);
  const [isFeatured, setIsFeatured] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [whatsappClicks, setWhatsappClicks] = useState(0);

  // Vídeos YouTube
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    async function loadShared() {
      try {
        const snapCats = await getDocs(collection(db, "categories"));
        if (!snapCats.empty) {
          const list = snapCats.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<CategoryDoc, "id">) }))
            .filter((c) => c.active !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (list.length > 0) setCategories(list);
        }
        const snapSet = await getDoc(doc(db, "settings", "global"));
        if (snapSet.exists()) {
          setSettings((prev) => ({ ...prev, ...(snapSet.data() as Partial<SiteSettings>) }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadShared();

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserBusiness(currentUser.uid);
      }
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  async function loadUserBusiness(uid: string) {
    try {
      const q = query(collection(db, "businesses"), where("ownerId", "==", uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data() as Business & { cep?: string; googleMapsUrl?: string };
        setBusinessId(docSnap.id);
        setName(data.name || "");
        setCategory(data.category || "alimentacao");
        setSubcategory(data.subcategory || "");
        setDescription(data.description || "");
        setCep(data.cep || "");
        setNeighborhood(data.neighborhood || "");
        setAddress(data.address || "");
        setGoogleMapsUrl(data.googleMapsUrl || "");
        setWhatsapp(data.whatsapp || "");
        setInstagram(data.instagram || "");
        setWebsite(data.website || "");
        setLogoUrl(data.logoUrl || "");
        setCoverUrl(data.coverUrl || "");
        setGallery(data.gallery || []);
        setMaxPhotos(data.maxPhotos ?? 5);
        setMaxVideos(data.maxVideos ?? 1);
        setIsFeatured(Boolean(data.isFeatured));
        setViewsCount(data.viewsCount || 0);
        setWhatsappClicks(data.whatsappClicks || 0);

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
    } catch (err) {
      console.error("Erro ao carregar empresa:", err);
    }
  }

  const handleCepBlur = async (inputCep: string) => {
    const cleanCep = inputCep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.bairro) setNeighborhood(data.bairro);
        if (data.logradouro) setAddress(`${data.logradouro}, `);
      }
    } catch {
      console.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
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
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const slug = `${createSlug(registerCompanyName)}-${cred.user.uid.slice(0, 5)}`;
        const initialPayload = {
          ownerId: cred.user.uid,
          name: registerCompanyName.trim(),
          slug,
          category: "alimentacao",
          subcategory: "",
          description: "Bem-vindo à nossa empresa no Caldas Online!",
          cep: "",
          neighborhood: "Centro",
          address: "",
          googleMapsUrl: "",
          whatsapp: "",
          instagram: "",
          website: "",
          logoUrl: "",
          coverUrl: "",
          gallery: [],
          maxPhotos: 5,
          maxVideos: 1,
          youtubeHorizontal: "",
          youtubeVerticals: [],
          coupon: { active: false, title: "", code: "", rules: "" },
          isFeatured: false,
          isApproved: true,
          viewsCount: 0,
          whatsappClicks: 0,
          createdAt: Date.now(),
        };
        await setDoc(doc(db, "businesses", slug), initialPayload);
        setName(registerCompanyName.trim());
        setBusinessId(slug);
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
    target: "logo" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === "logo") setUploadingLogo(true);
    else setUploadingCover(true);

    try {
      const url = await compressAndUploadImage(file);
      if (target === "logo") setLogoUrl(url);
      else setCoverUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      if (target === "logo") setUploadingLogo(false);
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
    if (!user || !businessId) return;

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

      const payload = {
        name: name.trim(),
        category,
        subcategory: subcategory.trim(),
        description: description.trim(),
        cep: cep.trim(),
        neighborhood: neighborhood.trim(),
        address: address.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        whatsapp: whatsapp.replace(/\D/g, ""),
        instagram: instagram.trim(),
        website: website.trim(),
        logoUrl,
        coverUrl,
        gallery: gallery.slice(0, maxPhotos),
        maxPhotos,
        maxVideos,
        youtubeHorizontal: maxVideos >= 1 ? youtubeHorizontal.trim() : "",
        youtubeVerticals: verticalVideos,
        coupon: {
          active: couponActive,
          title: couponTitle.trim(),
          code: couponCode.trim().toUpperCase(),
          rules: couponRules.trim(),
        },
      };

      await updateDoc(doc(db, "businesses", businessId), payload);
      alert("Página da sua empresa salva com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar dados da empresa.");
    } finally {
      setSaving(false);
    }
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
        <Navbar vipGroupUrl={settings.vipGroupUrl} />
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
                ? "Informe o nome da sua empresa, e-mail e senha para começar."
                : "Acesse sua conta para gerenciar seu anúncio no Caldas Online."}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Empresa *
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

  const upgradeWaUrl = `https://wa.me/${(settings.masterWhatsApp || "5564981005505").replace(
    /\D/g,
    ""
  )}?text=${encodeURIComponent(
    `Olá! Sou da empresa "${name || "cadastrada"}" no Caldas Online e gostaria de liberar mais fotos, vídeos verticais e destaque no portal.`
  )}`;

  const unlockedVerticalVideos = Math.max(0, maxVideos - 1);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar vipGroupUrl={settings.vipGroupUrl} />

      <main className="max-w-5xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* Topo do Painel com Nome da Empresa Logada */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0A4D9C] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Empresa Conectada
              </p>
              <h1 className="text-xl font-black text-slate-900">
                {name || "Minha Empresa"}
              </h1>
              <p className="text-xs text-slate-500">
                Plano atual: <strong>{maxPhotos} fotos</strong> e{" "}
                <strong>{maxVideos} vídeo(s)</strong> liberados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {businessId && (
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
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        {/* Métricas */}
        {businessId && (
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

            <a
              href={upgradeWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 sm:col-span-1 bg-gradient-to-r from-[#FF7A00] to-[#FFB800] rounded-2xl p-4 text-slate-950 shadow-sm flex flex-col justify-center hover:opacity-95 transition"
            >
              <p className="text-xs font-black uppercase">Quer mais fotos e vídeos?</p>
              <p className="text-xs font-semibold mt-0.5">
                Clique aqui para liberar pacote patrocinado →
              </p>
            </a>
          </div>
        )}

        <form onSubmit={handleSaveBusiness} className="space-y-6">
          {/* 1. DADOS PRINCIPAIS */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-extrabold text-slate-900">1. Informações da Empresa</h2>

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
                  Segmento / Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug || cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={(e) => handleCepBlur(e.target.value)}
                  placeholder="75650-000"
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
                  Link do Google Maps da Empresa (opcional)
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

          {/* 2. LOGOMARCA, CAPA E GALERIA COM LEGENDAS DE TAMANHO IDEAL */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0A4D9C]" />
                <h2 className="font-extrabold text-slate-900">
                  2. Logomarca, Capa e Galeria ({gallery.length}/{maxPhotos} fotos)
                </h2>
              </div>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg">
                Compressão automática • Máx. 1 MB final
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logomarca */}
              <div className="border border-dashed border-slate-300 rounded-2xl p-4 flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-16 h-16 rounded-xl object-cover border shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">
                    Logo
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Logomarca Quadrada</p>
                  <p className="text-[11px] text-slate-500">
                    Tamanho ideal: <strong>500x500px</strong> (1:1)
                  </p>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl cursor-pointer mt-1">
                    {uploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Enviar Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadSingle(e, "logo")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Capa */}
              <div className="border border-dashed border-slate-300 rounded-2xl p-4 flex items-center gap-4">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Capa"
                    className="w-24 h-16 rounded-xl object-cover border shrink-0"
                  />
                ) : (
                  <div className="w-24 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">
                    Capa
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Foto de Capa</p>
                  <p className="text-[11px] text-slate-500">
                    Tamanho ideal: <strong>1200x400px</strong> (Horizontal)
                  </p>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl cursor-pointer mt-1">
                    {uploadingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Enviar Capa
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadSingle(e, "cover")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Galeria */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Fotos da Galeria ({gallery.length} de {maxPhotos} utilizadas)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ideal: <strong>1080x1080px</strong> ou <strong>1080x1350px</strong> (aceita horizontal ou vertical direto do celular)
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
                  <a
                    href={upgradeWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#FF7A00] hover:underline"
                  >
                    Limite atingido • Liberar mais fotos
                  </a>
                )}
              </div>

              {gallery.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

          {/* 3. VÍDEOS DO YOUTUBE */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-600" />
                <h2 className="font-extrabold text-slate-900">
                  3. Vídeos do YouTube ({maxVideos} vídeo(s) liberados)
                </h2>
              </div>
            </div>

            {maxVideos >= 1 ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vídeo Principal Horizontal (Exibe primeiro em destaque)
                </label>
                <input
                  type="url"
                  value={youtubeHorizontal}
                  onChange={(e) => setYoutubeHorizontal(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nenhum vídeo habilitado para este cadastro.</p>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">
                  Vídeos Verticais (YouTube Shorts — {unlockedVerticalVideos} de 3 liberados)
                </p>
              </div>

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
                          <Lock className="w-3.5 h-3.5" /> Bloqueado no plano grátis
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. CUPOM DE DESCONTO */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#FF7A00]" />
                <h2 className="font-extrabold text-slate-900">
                  4. Cupom de Desconto Exclusivo
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
                    Oferta do Cupom *
                  </label>
                  <input
                    type="text"
                    required={couponActive}
                    value={couponTitle}
                    onChange={(e) => setCouponTitle(e.target.value)}
                    placeholder="Ex: 15% OFF na Pizza Grande"
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
                    placeholder="Ex: CALDAS15"
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
                    placeholder="Válido de seg a qui"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-lg inline-flex items-center justify-center gap-2 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            SALVAR E PUBLICAR PÁGINA DA EMPRESA
          </button>
        </form>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
