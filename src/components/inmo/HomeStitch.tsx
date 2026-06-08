"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";
import { propertyTypeLabels, statusLabels } from "@/lib/inmoData";
import FrontHeader from "@/components/inmo/FrontHeader";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const getCoverImage = (images: string[], coverIndex: number) => {
  if (!images.length) return "";
  return images[coverIndex] ?? images[0];
};

const fallbackHeroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDzWLJ1ZWYuCXv4uUt88LiRLMh6Kis0lEW9bZbHsLtWcsRCgtS5gGDYYDm3MEK1wSfzXnQIttSX6XW5vl8IyMI41AuH0r4TSctOX41XtfS0KEuaesTwOEQxFZ2wrNdo1BNdsgnmE5M3OJ-sO4yPFGYXZXUqaNLuH_jCe2MTLxpYuOf_L-7dDxXfImH4zAUslJI0QMbcb78l6j4xOPWyx_53wqiEyYTmTBUk_sucmOru6E9gt_HroO1fguRWslF7CchhD8Y-sBF9NQ";

const truncate = (value: string, max = 110) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}...`;
};

const getAttributeText = (attributes: Record<string, string[]>) =>
  Object.values(attributes).flat().join(" ").toLowerCase();

const hasFeature = (attributes: Record<string, string[]>, keywords: string[]) => {
  const value = getAttributeText(attributes);
  return keywords.some((keyword) => value.includes(keyword));
};

const getPropertyFeatures = (item: {
  rooms: number;
  area: number;
  attributes: Record<string, string[]>;
}) => [
  {
    icon: "bed",
    label: `${item.rooms} amb.`,
  },
  {
    icon: "square_foot",
    label: `${item.area} m²`,
  },
  {
    icon: "bathtub",
    label: hasFeature(item.attributes, ["baño", "bano", "bath", "ducha"])
      ? "Baño"
      : "Consultar",
  },
  {
    icon: "local_laundry_service",
    label: hasFeature(item.attributes, ["lavadero", "laundry", "lavarropas"])
      ? "Lavadero"
      : "Servicios",
  },
  {
    icon: "directions_car",
    label: hasFeature(item.attributes, ["cochera", "garage", "parking"])
      ? "Cochera"
      : "Opcional",
  },
];

const smoothSpring = {
  type: "spring" as const,
  stiffness: 92,
  damping: 18,
  mass: 0.9,
};

const sectionReveal = {
  hidden: { opacity: 0, y: 34, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: smoothSpring,
  },
};

const staggerGroup = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

const brandNameMotion = {
  hidden: { opacity: 0, x: -86, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { ...smoothSpring, duration: 0.95 },
  },
};

const brandXMotion = {
  hidden: { opacity: 0, x: 120, rotate: 18, scale: 1.32, filter: "blur(14px)" },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 110, damping: 14, mass: 0.92 },
  },
};

export default function HomeStitch() {
  const { state } = useInmoStore();
  const { listings, agents, theme, clientUsers, homeContent } = state;
  const [clientName, setClientName] = useState("");
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.45], [0, 90]);
  const heroImageScale = useTransform(scrollYProgress, [0, 0.45], [1.05, 1.15]);

  useEffect(() => {
    const hydrate = () => {
      try {
        const raw = window.localStorage.getItem("inmo-client-session/v1");
        if (!raw) {
          setClientName("");
          return;
        }
        const session = JSON.parse(raw) as { email?: string };
        if (!session.email) {
          setClientName("");
          return;
        }
        const match = clientUsers.find(
          (user) => user.email.toLowerCase() === session.email?.toLowerCase()
        );
        setClientName(match?.name ?? "");
      } catch {
        setClientName("");
      }
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
    } else {
      window.setTimeout(hydrate, 0);
    }
  }, [clientUsers]);

  const featuredListings = useMemo(
    () => listings.filter((item) => item.status === "disponible").slice(0, 6),
    [listings]
  );

  const heroImage = useMemo(() => {
    const activeBanner = homeContent.banners.find((banner) => banner.active && banner.image);
    if (activeBanner?.image) return activeBanner.image;
    if (theme.heroImage) return theme.heroImage;
    return fallbackHeroImage;
  }, [homeContent.banners, theme.heroImage]);

  const activeBanners = useMemo(
    () => homeContent.banners.filter((banner) => banner.active),
    [homeContent.banners]
  );

  const agentsById = useMemo(
    () => Object.fromEntries(agents.map((agent) => [agent.id, agent])),
    [agents]
  );

  const availableCount = listings.filter((item) => item.status === "disponible").length;
  const avgPrice = listings.length
    ? listings.reduce((acc, item) => acc + item.price, 0) / listings.length
    : 0;

  const recentListings = useMemo(() => [...listings].slice(-3).reverse(), [listings]);

  const themeStyles = buildThemeStyles(theme);

  return (
    <div
      style={themeStyles}
      className="bg-background text-on-background font-body selection:bg-primary-fixed selection:text-on-primary-fixed"
    >
      <FrontHeader active="home" />

      <main className="pt-20">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerGroup}
          className="relative flex min-h-[calc(100svh-4rem)] w-full items-center overflow-hidden bg-primary py-8 sm:min-h-[760px] sm:py-16"
        >
          <div className="absolute inset-0 z-0">
            <motion.img
              style={{ y: heroImageY, scale: heroImageScale }}
              className="h-full w-full object-cover will-change-transform"
              alt="Portada"
              src={heroImage}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/72 to-primary/12" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={staggerGroup}
              className="connexa-mark mb-6 flex max-w-3xl items-end overflow-hidden text-on-primary sm:mb-8"
            >
              <motion.span
                variants={brandNameMotion}
                className="font-headline text-3xl font-extrabold uppercase tracking-normal sm:text-4xl md:text-7xl"
              >
                Conne
              </motion.span>
              <motion.span
                variants={brandXMotion}
                className="font-headline text-4xl font-extrabold uppercase text-primary-fixed sm:text-5xl md:text-8xl"
              >
                x
              </motion.span>
              <motion.span
                variants={brandNameMotion}
                className="font-headline text-3xl font-extrabold uppercase tracking-normal sm:text-4xl md:text-7xl"
              >
                a
              </motion.span>
            </motion.div>
            <div className="max-w-3xl">
              <motion.span
                variants={sectionReveal}
                className="mb-6 inline-block rounded-full bg-primary-fixed px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-[0_20px_45px_-25px_rgba(255,243,194,0.8)]"
              >
                {homeContent.eyebrow}
              </motion.span>
              <motion.h1
                variants={sectionReveal}
                className="mb-5 text-4xl font-headline font-extrabold leading-[0.95] tracking-tighter text-on-primary sm:text-5xl md:text-8xl"
              >
                {homeContent.title} <br />
                <span className="font-light italic text-primary-fixed">{homeContent.italicTitle}</span>
              </motion.h1>
              <motion.p
                variants={sectionReveal}
                className="max-w-2xl text-sm leading-7 text-on-primary/90 sm:text-base md:text-lg"
              >
                {clientName
                  ? `Bienvenido, ${clientName}. Accedé a tus favoritos y consultas desde tu cuenta privada.`
                  : homeContent.subtitle}
              </motion.p>
              <motion.div variants={sectionReveal} className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                  href={homeContent.primaryCtaHref || "/propiedades"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-fixed px-6 py-3 text-sm font-bold text-primary shadow-[0_24px_45px_-28px_rgba(255,243,194,0.85)] sm:w-auto"
                  >
                    {homeContent.primaryCtaLabel}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                  href={homeContent.secondaryCtaHref || "/acceso"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/12 px-6 py-3 text-sm font-bold text-on-primary ghost-border backdrop-blur sm:w-auto"
                  >
                    {homeContent.secondaryCtaLabel}
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              variants={sectionReveal}
              className="mt-8 max-w-5xl rounded-[2rem] bg-surface-container-lowest/95 p-3 shadow-[0_40px_70px_-24px_rgba(27,54,93,0.5)] backdrop-blur sm:mt-12"
            >
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.65fr_auto]">
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                    {homeContent.statsTitle}
                  </p>
                  <p className="mt-2 text-3xl font-headline font-bold text-primary">{listings.length}</p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                    Disponibles
                  </p>
                  <p className="mt-2 text-3xl font-headline font-bold text-primary">{availableCount}</p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                    Precio medio
                  </p>
                  <p className="mt-2 text-xl font-headline font-bold text-primary">
                    {currencyFormatter.format(avgPrice || 0)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/propiedades?operacion=venta"
                    className="flex min-h-14 items-center justify-center rounded-2xl bg-primary-fixed px-6 py-3 text-center text-sm font-bold text-primary shadow-[0_18px_35px_-28px_rgba(255,243,194,0.8)]"
                  >
                    Comprar
                  </Link>
                  <Link
                    href="/propiedades?operacion=alquiler"
                    className="flex min-h-14 items-center justify-center rounded-2xl bg-surface-container-high px-6 py-3 text-center text-sm font-bold text-primary"
                  >
                    Alquilar
                  </Link>
                </div>
                <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={homeContent.primaryCtaHref || "/propiedades"}
                    className="brand-gradient flex h-full items-center justify-center gap-2 rounded-3xl px-8 py-4 text-sm font-bold tracking-tight text-on-primary"
                  >
                    Ver propiedades
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {activeBanners.length ? (
          <section className="mx-auto max-w-screen-2xl px-4 pb-8 pt-5 sm:-mt-12 sm:px-6 sm:pt-0 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2">
              {activeBanners.slice(0, 2).map((banner, index) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 28, scale: 0.97, filter: "blur(10px)" }}
                  whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ ...smoothSpring, delay: index * 0.08 }}
                  whileHover={{ y: -8, scale: 1.01 }}
                  className="will-change-transform"
                >
                  <Link
                    href={banner.ctaHref || "/propiedades"}
                    className="group relative block min-h-56 overflow-hidden rounded-3xl bg-primary text-on-primary pro-card"
                  >
                    {banner.image ? (
                      <motion.img
                        src={banner.image}
                        alt={banner.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
                    <div className="relative flex min-h-56 flex-col justify-end p-7">
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary-fixed">
                        Oportunidad destacada
                      </p>
                      <h2 className="mt-3 max-w-xl text-2xl font-headline font-bold text-on-primary">
                        {banner.title}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-on-primary/82">
                        {banner.subtitle}
                      </p>
                      <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
                        {banner.ctaLabel || "Ver más"}
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl bg-surface-container-lowest p-6 pro-card"
            >
              <span className="material-symbols-outlined text-3xl text-primary">home_work</span>
              <p className="mt-4 text-sm font-bold text-primary">Comprar con foco</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Entrá directo a propiedades en venta y compará precio, zona y características.
              </p>
            </motion.div>
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              transition={{ ...smoothSpring, delay: 0.06 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl bg-surface-container-lowest p-6 pro-card"
            >
              <span className="material-symbols-outlined text-3xl text-primary">apartment</span>
              <p className="mt-4 text-sm font-bold text-primary">Alquilar más simple</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Filtrá opciones mensuales o temporarias sin mezclar operaciones.
              </p>
            </motion.div>
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              transition={{ ...smoothSpring, delay: 0.12 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl bg-surface-container-lowest p-6 pro-card"
            >
              <span className="material-symbols-outlined text-3xl text-primary">favorite</span>
              <p className="mt-4 text-sm font-bold text-primary">Guardar favoritas</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Creá una cuenta y armá tu selección para decidir con más calma.
              </p>
            </motion.div>
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              transition={{ ...smoothSpring, delay: 0.18 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl bg-surface-container-lowest p-6 pro-card"
            >
              <span className="material-symbols-outlined text-3xl text-primary">forum</span>
              <p className="mt-4 text-sm font-bold text-primary">Consultar sin exponer datos</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Enviá tu consulta desde la ficha y Connexa responde por el canal correcto.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:mb-14 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-headline font-bold tracking-tighter text-primary sm:text-4xl">
                {homeContent.featuredTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-on-surface-variant">
                {homeContent.featuredSubtitle}
              </p>
            </div>
            <Link
              className="flex items-center gap-2 border-b-2 border-primary pb-1 text-sm font-bold uppercase tracking-widest"
              href="/propiedades"
            >
              Ver todas las propiedades
            </Link>
          </div>

          {featuredListings.length === 0 ? (
            <div className="rounded-xl bg-surface-container-lowest p-10 text-center shadow-[0_40px_60px_-15px_rgba(27,27,28,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Catálogo vacío
              </p>
              <h3 className="mt-4 text-2xl font-headline font-bold text-primary">
                Todavía no hay propiedades destacadas
              </h3>
              <Link
                href="/acceso"
                className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
              >
                Acceso clientes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredListings.slice(0, 6).map((item) => {
                const cover = getCoverImage(item.images, item.coverIndex);
                const video = item.videos?.[0];
                const agent = item.agentId ? agentsById[item.agentId] : undefined;
                const features = getPropertyFeatures(item);
                const narrative = truncate(
                  item.highlight ||
                    item.description ||
                    `${item.rooms} ambientes con ${item.area}m² en ${item.neighborhood}.`
                );

                return (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 36, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.22 }}
                    transition={{ ...smoothSpring, delay: (featuredListings.indexOf(item) % 3) * 0.05 }}
                    whileHover={{ y: -10, scale: 1.012 }}
                    className="group overflow-hidden rounded-3xl bg-surface-container-lowest pro-card will-change-transform"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {video ? (
                        <video
                          className="h-full w-full object-cover"
                          src={video}
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      ) : cover ? (
                        <motion.img
                          src={cover}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          whileHover={{ scale: 1.07 }}
                          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/15 to-transparent" />

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {item.tag ? (
                          <span className="rounded-full bg-surface-container-lowest/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                            {item.tag}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-primary/85 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary">
                          {statusLabels[item.status]}
                        </span>
                      </div>

                      <div className="absolute left-4 right-4 bottom-4 rounded-xl bg-surface-container-lowest/90 p-3 backdrop-blur">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-on-surface-variant">
                          <span>{propertyTypeLabels[item.type]}</span>
                          <span>{item.area} m²</span>
                        </div>
                        <p className="mt-2 text-lg font-bold text-primary">
                          {currencyFormatter.format(item.price)}
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-headline font-bold text-primary">{item.title}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {item.neighborhood || "Ubicación privada"}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">{narrative}</p>

                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {features.map((feature) => (
                          <div
                            key={`${item.id}-${feature.icon}`}
                            className="flex min-w-0 flex-col items-center rounded-2xl bg-surface-container-low px-2 py-2 text-center"
                          >
                            <span className="material-symbols-outlined text-lg text-primary">
                              {feature.icon}
                            </span>
                            <span className="mt-1 max-w-full truncate text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              {feature.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
                        <span>{propertyTypeLabels[item.type]}</span>
                        {agent ? <span>Asesor disponible</span> : <span>Consulta directa</span>}
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                          <Link
                          href={`/propiedades/${item.id}`}
                          className="text-sm font-semibold text-primary hover:text-primary-container"
                          >
                            Ver detalle completo
                          </Link>
                        </motion.div>
                        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                          <Link
                          href={`/propiedades/${item.id}`}
                            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-on-primary"
                          >
                            Agendar
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        <section id="como-avanzar" className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.22 }}
            className="rounded-3xl bg-surface-container-lowest p-5 pro-card sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                  <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">
                  {homeContent.teamTitle}
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {homeContent.teamSubtitle}
                </p>
              </div>
              <Link href="/propiedades" className="text-sm font-semibold text-primary">
                Ver propiedades
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <motion.div whileHover={{ y: -6, scale: 1.01 }}>
                <Link
                href="/propiedades?operacion=venta"
                  className="block rounded-3xl bg-surface-container-low p-6"
                >
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Comprar
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-primary">
                    Ver propiedades en venta
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Listado enfocado para buscar unidades disponibles para compra.
                  </p>
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -6, scale: 1.01 }}>
                <Link
                href="/propiedades?operacion=alquiler"
                  className="block rounded-3xl bg-surface-container-low p-6"
                >
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Alquilar
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-primary">
                    Ver alquileres disponibles
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Opciones mensuales y temporarias separadas de las ventas.
                  </p>
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -6, scale: 1.01 }}>
                <Link
                href="/registro"
                  className="block rounded-3xl bg-surface-container-low p-6"
                >
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Cuenta
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-primary">
                    Guardar y consultar
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Guardá favoritas y seguí tus consultas desde tu cuenta.
                  </p>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section id="insights" className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.22 }}
            className="rounded-3xl bg-surface-container-lowest p-5 pro-card sm:p-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">
                  {homeContent.recentTitle}
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {homeContent.recentSubtitle}
                </p>
              </div>
              <Link href="/propiedades" className="text-sm font-semibold text-primary">
                Ver propiedades
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              {recentListings.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No hay nuevas incorporaciones aún.</p>
              ) : (
                recentListings.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ ...smoothSpring, delay: index * 0.06 }}
                    whileHover={{ y: -5, scale: 1.01 }}
                  >
                    <Link
                      href={`/propiedades/${item.id}`}
                      className="block rounded-3xl bg-surface-container-low p-4"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {statusLabels[item.status]}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-primary">{item.title}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{item.neighborhood}</p>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
