"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { compressAndUploadImage } from "@/lib/cloudinary";
import { CATEGORIES } from "@/lib/constants";
import { Business } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Store,
  MapPin,
  Upload,
  Ticket,
  Eye,
  MessageCircle,
  LogOut,
  Save,
  Loader2,
  Navigation,
  ExternalLink,
  Trash2,
} from "lucide-react";
import Link from "next/link";

function createSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function BusinessDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Campos de Login/Cadastro
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Dados da Empresa
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "alimentacao",
    subcategory: "",
    description: "",
    neighborhood: "",
    address: "",
    lat: "" as string | number,
    lng: "" as string | number,
    whatsapp: "",
    website: "",
    instagram: "",
    facebook: "",
    logoUrl: "",
    coverUrl: "",
    gallery: [] as string[],
    couponActive: false,
    couponTitle: "",
    couponCode: "",
    couponRules: "",
    isFeatured: false,
    isApproved: true,
    viewsCount: 0,
    whatsappClicks: 0,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserBusiness(currentUser.uid);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  async function loadUserBusiness(uid: string) {
    try {
      const q = query(collection(db, "businesses"), where("ownerId", "==", uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data() as Business;
        setBusinessId(d.id);
        setForm({
          name: data.name || "",
          category: data.category || "alimentacao",
          subcategory: data.subcategory || "",
          description: data.description || "",
          neighborhood: data.neighborhood || "",
          address: data.address || "",
          lat: data.lat ?? "",
          lng: data.lng ?? "",
          whatsapp: data.whatsapp || "",
          website: data.website || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          logoUrl: data.logoUrl || "",
          coverUrl: data.coverUrl || "",
          gallery: data.gallery || [],
          couponActive: data.coupon?.active || false,
          couponTitle: data.coupon?.title || "",
          couponCode: data.coupon?.code || "",
          couponRules: data.coupon?.rules || "",
          isFeatured: data.isFeatured || false,
          isApproved: data.isApproved ?? true,
          viewsCount: data.viewsCount || 0,
          whatsappClicks: data.whatsappClicks || 0,
        });
      }
    } catch (err) {
      console.error("Erro ao carregar dados da empresa:", err);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao autenticar.";
      if (message.includes("invalid-credential") || message.includes("wrong-password")) {
        setAuthError("E-mail ou senha incorretos.");
      } else if (message.includes("email-already-in-use")) {
        setAuthError("Este e-mail já está cadastrado. Faça login.");
      } else if (message.includes("weak-password")) {
        setAuthError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setAuthError("Não foi possível acessar. Verifique os dados.");
      }
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta captura de GPS.");
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        }));
        setGettingGps(false);
      },
      () => {
        alert("Não foi possível obter sua localização atual.");
        setGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "logo" | "cover" | "gallery"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      if (target === "gallery") {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < Math.min(files.length, 6); i++) {
          const url = await compressAndUploadImage(files[i]);
          uploadedUrls.push(url);
        }
        setForm((prev) => ({
          ...prev,
          gallery: [...prev.gallery, ...uploadedUrls].slice(0, 8),
        }));
      } else {
        const url = await compressAndUploadImage(files[0]);
        if (target === "logo") {
          setForm((prev) => ({ ...prev, logoUrl: url }));
        } else {
          setForm((prev) => ({ ...prev, coverUrl: url }));
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccessMsg("");

    try {
      const slug = `${createSlug(form.name)}-${user.uid.slice(0, 4)}`;
      const payload = {
        ownerId: user.uid,
        name: form.name.trim(),
        slug,
        category: form.category,
        subcategory: form.subcategory.trim(),
        description: form.description.trim(),
        neighborhood: form.neighborhood.trim(),
        address: form.address.trim(),
        lat: form.lat !== "" ? Number(form.lat) : null,
        lng: form.lng !== "" ? Number(form.lng) : null,
        whatsapp: form.whatsapp.trim(),
        website: form.website.trim(),
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        logoUrl: form.logoUrl,
        coverUrl: form.coverUrl,
        gallery: form.gallery,
        coupon: {
          active: form.couponActive,
          title: form.couponTitle.trim(),
          code: form.couponCode.trim().toUpperCase(),
          rules: form.couponRules.trim(),
        },
        isFeatured: form.isFeatured,
        isApproved: form.isApproved,
      };

      if (businessId) {
        await updateDoc(doc(db, "businesses", businessId), payload);
      } else {
        const docRef = await addDoc(collection(db, "businesses"), {
          ...payload,
          viewsCount: 0,
          whatsappClicks: 0,
          createdAt: Date.now(),
        });
        setBusinessId(docRef.id);
      }

      setSuccessMsg("Dados da empresa salvos e publicados com sucesso!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar cadastro.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A4D9C]" />
      </div>
    );
  }

  // TELA DE LOGIN / CADASTRO DE EMPRESAS
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 max-w-md w-full p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#0A4D9C] text-white flex items-center justify-center mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              {isRegisterMode ? "Cadastrar Minha Empresa" : "Área do Lojista"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isRegisterMode
                ? "Crie sua conta gratuita para divulgar sua empresa e cupons em Caldas Novas."
                : "Acesse seu painel para editar fotos, endereço e cupons de desconto."}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@suaempresa.com.br"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0A4D9C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0A4D9C]"
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
                  ? "Já tem conta? Faça login aqui"
                  : "Ainda não anunciou? Cadastre sua empresa grátis"}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // PAINEL DO LOJISTA LOGADO
  const currentSlug = form.name ? `${createSlug(form.name)}-${user.uid.slice(0, 4)}` : "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* Topo com Métricas de Valor */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#0A4D9C] uppercase">Painel da Empresa</span>
            <h1 className="text-xl font-black text-slate-900">
              {form.name || "Configure sua Vitrine"}
            </h1>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {businessId && currentSlug && (
              <Link
                href={`/empresa/${currentSlug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-[#0A4D9C] px-3.5 py-2.5 rounded-xl hover:bg-blue-100 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ver Minha Página
              </Link>
            )}
            <button
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-700 px-3.5 py-2.5 rounded-xl hover:bg-slate-200 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        {/* Termômetro de Resultados */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0A4D9C] flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{form.viewsCount}</p>
              <p className="text-xs text-slate-500 font-medium">Visualizações na página</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{form.whatsappClicks}</p>
              <p className="text-xs text-slate-500 font-medium">Cliques no seu WhatsApp</p>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO COMPLETO DA EMPRESA */}
        <form onSubmit={handleSaveBusiness} className="space-y-6">
          {/* Bloco 1: Informações Básicas */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-extrabold text-slate-900 text-base">1. Dados Principais</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate
