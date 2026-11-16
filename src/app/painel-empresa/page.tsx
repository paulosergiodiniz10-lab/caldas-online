"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  MessageCircle,
  Lock,
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  const [categories, setCategories] = useState<CategoryDoc[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);

  // Campos da Empresa
  const [name, setName] = useState("");
  const [category, setCategory] = useState("alimentacao");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);

  // Limites controlados pelo Master (Padrão: 5 fotos e 1 vídeo)
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

  // Loaders de Upload
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
        const data = docSnap.data() as Business;
        setBusinessId(docSnap.id);
        setName(data.name || "");
        setCategory(data.category || "alimentacao");
        setSubcategory(data.subcategory || "");
        setDescription(data.description || "");
        setNeighborhood(data.neighborhood || "");
        setAddress(data.address || "");
        setLat(data.lat ?? null);
        setLng(data.lng ?? null);
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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSubmittingAuth(true);
    try {
      if (isRegisterMode) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch {
      setAuthError(
        isRegisterMode
          ? "Não foi possível criar a conta. Verifique o e-mail ou use uma senha com 6+ caracteres."
          : "E-mail ou senha incorretos."
      );
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta GPS.");
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGettingGps(false);
        alert("Localização GPS capturada com sucesso!");
      },
      () => {
        setGettingGps(false);
        alert("Permita o acesso à localização no navegador para marcar no mapa.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
      alert(
        `Você atingiu o limite de ${maxPhotos} fotos do seu plano. Fale com o Caldas Online para liberar mais fotos!`
      );
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

    // Validar links do YouTube
    const allVideoInputs = [
      youtubeHorizontal,
      youtubeVertical1,
      youtubeVertical2,
      youtubeVertical3,
    ];
    for (const link of allVideoInputs) {
      if (!isValidYoutubeUrl(link)) {
        alert(
          "Atenção: Aceitamos apenas links do YouTube (youtube.com ou youtu.be) para manter o site rápido."
        );
        return;
      }
    }

    setSaving(true);
    try {
      const slug = businessId || `${createSlug(name)}-${user.uid.slice(0, 5)}`;

      // Monta lista de vídeos verticais respeitando o limite maxVideos (1 = só horizontal; 2..4 = libera verticais)
      const allowedVerticalCount = Math.max(0, maxVideos - 1);
      const verticalVideos = [youtubeVertical1, youtubeVertical2, youtubeVertical3]
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, allowedVerticalCount);

      const payload: Omit<Business, "id"> = {
        ownerId: user.uid,
        name: name.trim(),
        slug,
        category,
        subcategory: subcategory.trim(),
        description: description.trim(),
        neighborhood: neighborhood.trim(),
        address: address.trim(),
        lat,
        lng,
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
        isFeatured,
        isApproved: true,
        viewsCount,
        whatsappClicks,
        createdAt: Date.now(),
      };

      if (businessId) {
        await updateDoc(doc(db, "businesses", businessId), payload);
      } else {
        await setDoc(doc(db, "businesses", slug), payload);
        setBusinessId(slug);
      }

      alert("Página da sua empresa salva e publicada com sucesso!");
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
              {isRegisterMode ? "Cadastrar Minha Empresa" : "Área da Empresa"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isRegisterMode
                ? "Crie sua conta gratuita e coloque sua empresa no guia de Caldas Novas."
                : "Acesse seu painel para editar fotos, vídeos, cupom e WhatsApp."}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha (mínimo 6 caracteres) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
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
                className="w-full bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-sm py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {submittingAuth && <Loader2 className="w-4 h-4 animate-spin" />}
                {isRegisterMode ? "Criar Conta Grátis" : "Entrar no Painel"}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError("");
                }}
                className="text-xs font-bold text-[#0A4D9C] hover:underline"
              >
                {isRegisterMode
                  ? "Já tem cadastro? Fazer login"
                  : "Ainda não cadastrou sua empresa? Criar conta grátis"}
              </button>
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
        {/* Topo do Painel do Lojista */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">
              Painel da Minha Empresa
            </h1>
            <p className="text-xs text-slate-500">
              Plano atual: <strong>{maxPhotos} fotos</strong> e{" "}
              <strong>{maxVideos} vídeo(s)</strong> liberados
            </p>
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

        {/* Métricas Rápidas */}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Quadra, Lote..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
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
                  placeholder="Conte aos clientes o que sua empresa oferece, horário de funcionamento, diferenciais..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* GPS */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                {lat && lng ? (
                  <span className="text-emerald-700 font-bold">
                    ✓ Localização GPS salva ({lat.toFixed(4)}, {lng.toFixed(4)})
                  </span>
                ) : (
                  <span>Marque sua localização para aparecer no filtro &quot;Perto de mim&quot;.</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={gettingGps}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl"
              >
                {gettingGps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                )}
                Capturar Minha Localização Atual
              </button>
            </div>
          </div>

          {/* 2. LOGOMARCA, CAPA E GALERIA DE FOTOS (TRAVA 1MB + LIMITE DINÂMICO) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0A4D9C]" />
                <h2 className="font-extrabold text-slate-900">
                  2. Logomarca, Capa e Galeria ({gallery.length}/{maxPhotos} fotos)
                </h2>
              </div>
              <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg">
                Tamanho máximo por foto: 1 MB (Horizontal ou Vertical)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo */}
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
                <div>
                  <p className="text-xs font-bold text-slate-800 mb-1">Logomarca Quadrada</p>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl cursor-pointer">
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
                <div>
                  <p className="text-xs font-bold text-slate-800 mb-1">Foto de Capa</p>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl cursor-pointer">
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

            {/* Galeria Adaptável */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">
                  Fotos da Galeria ({gallery.length} de {maxPhotos} utilizadas)
                </p>

                {gallery.length < maxPhotos ? (
                  <label className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-[#0A4D9C] hover:bg-[#062F63] text-white px-3.5 py-2 rounded-xl cursor-pointer">
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

          {/* 3. VÍDEOS DO YOUTUBE (1 HORIZONTAL + ATÉ 3 VERTICAIS) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-600" />
                <h2 className="font-extrabold text-slate-900">
                  3. Vídeos do YouTube ({maxVideos} vídeo(s) liberados)
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Somente links do YouTube (se deixar em branco, não aparece nada)
              </span>
            </div>

            {/* Vídeo 1: Horizontal (sempre primeiro) */}
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

            {/* Vídeos Verticais (Shorts) */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">
                  Vídeos Verticais (YouTube Shorts — {unlockedVerticalVideos} de 3 liberados)
                </p>
                {unlockedVerticalVideos < 3 && (
                  <a
                    href={upgradeWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#0A4D9C] hover:underline"
                  >
                    Liberar até 3 vídeos verticais →
                  </a>
                )}
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
