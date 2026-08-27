import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, MapPin, ShieldCheck, Star, Heart, Filter, ArrowLeft,
  Wifi, Utensils, Car, Dumbbell, BookOpen, Shield, Sparkles, Phone,
  MessageCircle, Check, X, ChevronRight, Building2, Users, Home,
  User, Bookmark, Bell, Camera, Clock, AlertCircle, Lock, Banknote,
  ChevronLeft, ChevronDown, Navigation2, ThumbsUp, Award, Zap,
  CalendarDays, CreditCard, CheckCircle2, Info, Share2, Loader2,
  Bot, Send, Trash2, HelpCircle, ShoppingBag, Tag, Plus, FileText,
  Download, ExternalLink
} from "lucide-react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";

/* ══════════════════════════════════════
   HOOKS
══════════════════════════════════════ */
function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setV(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return v;
}

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator?.standalone === true;
  });

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("📲 To Install NESTRO App on your device:\n\n• On Chrome (Desktop): Click the install icon ⊕ in your URL bar.\n• On Android (Chrome): Tap menu (⋮) > 'Install app' or 'Add to Home screen'.\n• On iPhone (Safari): Tap Share (⎙) > 'Add to Home Screen'.");
    }
  };

  return { isInstallable: !isInstalled, isInstalled, installApp };
}

/* ══════════════════════════════════════
   DATA
══════════════════════════════════════ */
const AREAS = [
  "All",
  "Sanjivani Campus",
  "College Road",
  "Shirdi Road",
  "Station Road",
  "Samata Nagar",
  "Shivaji Nagar",
  "Main Market",
  "Yeola Road",
  "Bet Kopargaon"
];

const LISTINGS = [
  {
    id: 1,
    name: "Narayani Girls Hostel",
    type: "Girls Hostel",
    gender: "Women",
    area: "Sanjivani Campus",
    distanceKm: 0.4,
    rent: 4500,
    deposit: 5000,
    rating: 4.8,
    reviews: 28,
    verified: true,
    accent: "#9B4EA0",
    photos: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    ],
    gradients: [
      "linear-gradient(135deg, #702459 0%, #B84D88 100%)",
      "linear-gradient(135deg, #5B1526 0%, #8C243E 100%)",
      "linear-gradient(135deg, #4A154B 0%, #7E287C 100%)"
    ],
    amenities: ["WiFi", "Meals", "Security", "Laundry", "Study Room"],
    highlights: ["Right Opposite Sanjivani Campus", "24/7 In-House Female Warden & CCTV", "Hygienic Home-Style Veg Mess Included", "Pure RO Water & Hot Water Supply"],
    desc: "Narayani Girls Hostel is a premier, verified student accommodation situated right next to Sanjivani University & College of Engineering in Kopargaon. Built with safety and comfort in mind, it provides furnished rooms with study tables, high-speed WiFi, nutritious daily meals, and secure biometric entry.",
    nearbyColleges: [
      "Sanjivani University (0.4 km)",
      "Sanjivani College of Engineering (0.3 km)",
      "Kopargaon Railway Station (2.8 km)"
    ],
    rules: [
      "Curfew strictly at 9:30 PM",
      "No smoking / alcohol permitted",
      "Visitors allowed in reception lobby only",
      "Quiet hours for study after 10:00 PM"
    ],
    owner: {
      name: "Mrs. Shailaja Patil",
      rating: 4.9,
      responseTime: "Responds within 10 mins",
      phone: "98220 14560",
      since: "2021"
    },
    ownerScore: 780,
    roomTypes: [
      { type: "Triple Sharing Room", size: "190 sq ft", rent: 4500, deposit: 5000, available: 4, occupancy: "3 Beds" },
      { type: "Twin Sharing Room", size: "150 sq ft", rent: 5200, deposit: 5000, available: 2, occupancy: "2 Beds" },
      { type: "Single Private Room", size: "120 sq ft", rent: 6800, deposit: 6000, available: 1, occupancy: "1 Bed" }
    ],
    reviewsList: [
      { author: "Pooja S.", college: "Sanjivani COE (Comp Sci)", date: "Aug 2026", rating: 5, text: "Very safe and clean hostel. The food is really like home and college gate is just 3 minutes walk." },
      { author: "Anjali K.", college: "Sanjivani University (MBA)", date: "Jul 2026", rating: 4.8, text: "Best hostel for girls in Kopargaon. Warden ma'am is very supportive and WiFi is super fast." }
    ],
    disputeMetrics: { onTimeRentPct: 99, disputesLogged: 0, avgResolutionDays: 1 }
  },
  {
    id: 2,
    name: "Trividha Girls Hostel",
    type: "Girls Hostel",
    gender: "Women",
    area: "College Road",
    distanceKm: 0.6,
    rent: 4800,
    deposit: 5000,
    rating: 4.7,
    reviews: 24,
    verified: true,
    accent: "#B83280",
    photos: [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
    ],
    gradients: [
      "linear-gradient(135deg, #831843 0%, #BE185D 100%)",
      "linear-gradient(135deg, #6E1A30 0%, #9D174D 100%)",
      "linear-gradient(135deg, #500724 0%, #881337 100%)"
    ],
    amenities: ["WiFi", "Meals", "Security", "Study Room", "Parking"],
    highlights: ["Walking Distance to Campus", "Dedicated Silent Study Hall", "Daily Room Housekeeping", "Power Backup & Inverter"],
    desc: "Trividha Girls Hostel offers a secure, homely environment with modern amenities tailored specifically for female students of Sanjivani Group of Institutes. Featuring nutritious dining, dedicated study zones, and 24/7 security surveillance.",
    nearbyColleges: [
      "Sanjivani University (0.6 km)",
      "Kopargaon College of Pharmacy (0.8 km)",
      "Sanjivani Hospital (1.1 km)"
    ],
    rules: [
      "Hostel in-time by 9:00 PM",
      "Valid College ID required for check-in",
      "No loud music after 10:30 PM",
      "Cleanliness maintained in mess & rooms"
    ],
    owner: {
      name: "Trividha Management (Mrs. Sunita)",
      rating: 4.8,
      responseTime: "Responds in 15 mins",
      phone: "94231 67890",
      since: "2020"
    },
    ownerScore: 760,
    roomTypes: [
      { type: "Standard Double Sharing", size: "160 sq ft", rent: 4800, deposit: 5000, available: 3, occupancy: "2 Beds" },
      { type: "Triple Economy Sharing", size: "200 sq ft", rent: 4200, deposit: 4500, available: 5, occupancy: "3 Beds" }
    ],
    reviewsList: [
      { author: "Snehal D.", college: "Sanjivani Polytechnic", date: "Aug 2026", rating: 5, text: "Awesome study atmosphere and very peaceful locality on College Road." }
    ],
    disputeMetrics: { onTimeRentPct: 98, disputesLogged: 0, avgResolutionDays: 1 }
  },
  {
    id: 3,
    name: "MAJOR HOUSE (BOYS HOSTEL)",
    type: "Boys Hostel",
    gender: "Men",
    area: "Sanjivani Campus",
    distanceKm: 0.5,
    rent: 4200,
    deposit: 4500,
    rating: 4.6,
    reviews: 35,
    verified: true,
    accent: "#1E3A8A",
    photos: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"
    ],
    gradients: [
      "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
      "linear-gradient(135deg, #1E293B 0%, #3B82F6 100%)",
      "linear-gradient(135deg, #0F172A 0%, #1D4ED8 100%)"
    ],
    amenities: ["WiFi", "Meals", "Parking", "Security", "Laundry"],
    highlights: ["Immediate Proximity to Sanjivani Gates", "Large Ventilated Rooms & Balconies", "CCTV & Secure Two-Wheeler Parking", "Mess & Canteen Facility"],
    desc: "Major House Boys Hostel is one of the most popular student hubs in Kopargaon, located right near Sanjivani campus. Offers high-speed internet, spacious rooms with wooden beds & mattresses, study desks, and full meal plans.",
    nearbyColleges: [
      "Sanjivani College of Engineering (0.5 km)",
      "Sanjivani University (0.5 km)",
      "College Grounds & Canteen (0.4 km)"
    ],
    rules: [
      "Quiet hours after 11:00 PM",
      "No alcohol or smoking allowed",
      "Keep parking area clean and organized",
      "Inform warden before overnight leave"
    ],
    owner: {
      name: "Captain R. Jadhav (Major)",
      rating: 4.7,
      responseTime: "Responds in 5 mins",
      phone: "98605 43210",
      since: "2018"
    },
    ownerScore: 795,
    roomTypes: [
      { type: "Double Sharing Deluxe", size: "170 sq ft", rent: 4500, deposit: 4500, available: 6, occupancy: "2 Beds" },
      { type: "Triple Sharing Student Room", size: "220 sq ft", rent: 4000, deposit: 4000, available: 8, occupancy: "3 Beds" }
    ],
    reviewsList: [
      { author: "Aditya T.", college: "Sanjivani COE (Mech)", date: "Aug 2026", rating: 5, text: "Best boys hostel near campus. Strict discipline, great food and high speed wifi for coding." },
      { author: "Rahul M.", college: "Sanjivani (Civil)", date: "Jul 2026", rating: 4.5, text: "Very close to college, saves travel time every day." }
    ],
    disputeMetrics: { onTimeRentPct: 99, disputesLogged: 0, avgResolutionDays: 1 }
  },
  {
    id: 4,
    name: "Sai Tirupati Boys Hostel",
    type: "Boys Hostel",
    gender: "Men",
    area: "College Road",
    distanceKm: 0.7,
    rent: 4400,
    deposit: 4500,
    rating: 4.8,
    reviews: 42,
    verified: true,
    accent: "#047857",
    photos: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
    ],
    gradients: [
      "linear-gradient(135deg, #064E3B 0%, #059669 100%)",
      "linear-gradient(135deg, #065F46 0%, #10B981 100%)",
      "linear-gradient(135deg, #022C22 0%, #047857 100%)"
    ],
    amenities: ["WiFi", "Meals", "Security", "Laundry", "Parking", "Study Room"],
    highlights: ["Top Rated by Sanjivani Students", "Unlimited Tasty Mess Meals", "Solar Water Heating System", "Daily Housekeeping & Purified Water"],
    desc: "Sai Tirupati Boys Hostel is a top-rated student residence on College Road, Kopargaon. Provides clean, well-lit rooms with attached bathrooms, study desks, solar hot water, fast WiFi, and delicious hygienic food.",
    nearbyColleges: [
      "Sanjivani University (0.7 km)",
      "Sanjivani Engineering College (0.6 km)",
      "College Road Market (0.3 km)"
    ],
    rules: [
      "Hostel in-time by 10:00 PM",
      "Maintain cleanliness in common washrooms",
      "Zero tolerance for ragging or disturbance",
      "Electricity conservation appreciated"
    ],
    owner: {
      name: "Mr. Tirupati Deshmukh",
      rating: 4.9,
      responseTime: "Responds in 10 mins",
      phone: "98224 88771",
      since: "2019"
    },
    ownerScore: 810,
    roomTypes: [
      { type: "Twin Sharing Attached Bath", size: "175 sq ft", rent: 4800, deposit: 5000, available: 4, occupancy: "2 Beds" },
      { type: "Triple Sharing Standard", size: "210 sq ft", rent: 4200, deposit: 4500, available: 6, occupancy: "3 Beds" }
    ],
    reviewsList: [
      { author: "Kunal J.", college: "Sanjivani COE (IT)", date: "Aug 2026", rating: 5, text: "The mess food is definitely the best in Kopargaon. Clean rooms and friendly owner." }
    ],
    disputeMetrics: { onTimeRentPct: 100, disputesLogged: 0, avgResolutionDays: 1 }
  },
  {
    id: 5,
    name: "Atma Malik Hostel & Residency",
    type: "Hostel",
    gender: "Any",
    area: "Shirdi Road",
    distanceKm: 1.8,
    rent: 3800,
    deposit: 4000,
    rating: 4.5,
    reviews: 31,
    verified: true,
    accent: "#B45309",
    photos: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
    ],
    gradients: [
      "linear-gradient(135deg, #78350F 0%, #D97706 100%)",
      "linear-gradient(135deg, #451A03 0%, #B45309 100%)",
      "linear-gradient(135deg, #92400E 0%, #F59E0B 100%)"
    ],
    amenities: ["Meals", "Security", "Parking", "Study Room", "WiFi"],
    highlights: ["Spacious Serene Green Campus", "Pure Satvik Vegetarian Dining", "Disciplined Academic Environment", "Frequent Auto & Bus Connectivity"],
    desc: "Atma Malik Hostel & Residency in Kopargaon on Shirdi Road offers a serene, disciplined, and spiritual student stay. Features vast open spaces, large study rooms, pure vegetarian mess, and round-the-clock security.",
    nearbyColleges: [
      "Sanjivani University (1.8 km)",
      "Atma Malik Educational Complex (0.3 km)",
      "Shirdi-Kopargaon Highway (0.5 km)"
    ],
    rules: [
      "Strict Satvik vegetarian environment (no non-veg)",
      "Morning prayer & quiet study hours",
      "Gate closes at 9:00 PM",
      "Smoking & alcohol strictly prohibited"
    ],
    owner: {
      name: "Atma Malik Trust Administration",
      rating: 4.8,
      responseTime: "Responds in 30 mins",
      phone: "94222 33445",
      since: "2015"
    },
    ownerScore: 770,
    roomTypes: [
      { type: "4-Bed Shared Residency Room", size: "260 sq ft", rent: 3500, deposit: 3500, available: 12, occupancy: "4 Beds" },
      { type: "Twin Sharing Study Room", size: "180 sq ft", rent: 4200, deposit: 4000, available: 5, occupancy: "2 Beds" }
    ],
    reviewsList: [
      { author: "Saurabh N.", college: "Sanjivani University", date: "Jul 2026", rating: 5, text: "Very peaceful for studies. Great environment away from city noise." }
    ],
    disputeMetrics: { onTimeRentPct: 100, disputesLogged: 0, avgResolutionDays: 1 }
  },
  {
    id: 6,
    name: "Dwarkamai Hostel",
    type: "Hostel",
    gender: "Men",
    area: "Station Road",
    distanceKm: 1.2,
    rent: 3900,
    deposit: 4000,
    rating: 4.6,
    reviews: 26,
    verified: true,
    accent: "#4C1D95",
    photos: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    ],
    gradients: [
      "linear-gradient(135deg, #3B0764 0%, #7C3AED 100%)",
      "linear-gradient(135deg, #581C87 0%, #8B5CF6 100%)",
      "linear-gradient(135deg, #2E1065 0%, #6D28D9 100%)"
    ],
    amenities: ["WiFi", "Meals", "Parking", "Security"],
    highlights: ["Pocket-Friendly Pricing", "Near Kopargaon Railway Station & Market", "Homely Daily Mess", "Clean Drinking Water & Inverter"],
    desc: "Dwarkamai Hostel provides affordable and comfortable student accommodation on Station Road, Kopargaon. Perfect for college students seeking reliable mess, easy access to transport, and a warm, supportive atmosphere.",
    nearbyColleges: [
      "Sanjivani College of Engineering (1.2 km)",
      "Kopargaon Railway Station (1.4 km)",
      "Main Market & Bus Stand (0.8 km)"
    ],
    rules: [
      "Hostel in-time by 10:00 PM",
      "Careful handling of hostel property",
      "No unauthorized guests in rooms",
      "Timely monthly mess fee payment"
    ],
    owner: {
      name: "Mr. Rameshwar Gite",
      rating: 4.7,
      responseTime: "Responds in 15 mins",
      phone: "98501 22334",
      since: "2019"
    },
    ownerScore: 765,
    roomTypes: [
      { type: "Triple Sharing Student Room", size: "200 sq ft", rent: 3900, deposit: 4000, available: 6, occupancy: "3 Beds" },
      { type: "Twin Sharing Room", size: "160 sq ft", rent: 4400, deposit: 4500, available: 3, occupancy: "2 Beds" }
    ],
    reviewsList: [
      { author: "Ganesh P.", college: "Sanjivani Polytechnic", date: "Aug 2026", rating: 4.7, text: "Affordable and very close to the station. Food is tasty and fresh." }
    ],
    disputeMetrics: { onTimeRentPct: 98, disputesLogged: 0, avgResolutionDays: 1 }
  }
];

const SCORE_MIN = 300, SCORE_MAX = 850;
const scorePct = s => Math.max(0, Math.min(1, (s - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)));
const AMENITY_ICONS = { WiFi: Wifi, Meals: Utensils, Parking: Car, Gym: Dumbbell, "Study Room": BookOpen, Security: Shield, Laundry: Sparkles };

/* ══════════════════════════════════════
   SMALL COMPONENTS
══════════════════════════════════════ */
function TrustRing({ score, size = 44 }) {
  const sw = 4, r = (size - sw) / 2, c = 2 * Math.PI * r, pct = scorePct(score);
  const color = score >= 750 ? "#16A34A" : score >= 600 ? "#C9A24B" : "#DC2626";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F0DEDD" strokeWidth={sw} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: size * 0.24, fontWeight: 700, color: "#2E0A16" }}>{score}</span>
      </div>
    </div>
  );
}

function Stars({ rating, size = 12 }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= Math.round(rating) ? "#F59E0B" : "none"}
          color={i <= Math.round(rating) ? "#F59E0B" : "#D4B896"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

function Pill({ children, color = "#5B1526", bg = "#FBEEEC", border = "#EADCD9" }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: bg, color, border: `1px solid ${border}`, fontFamily: "Inter,sans-serif", whiteSpace: "nowrap", display: "inline-block" }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════
   IMAGE GALLERY (colour placeholder strips)
══════════════════════════════════════ */
function Gallery({ listing, height = 240 }) {
  const [idx, setIdx] = useState(0);
  const labels = ["Room View", "Study & Desk Area", "Dining & Mess Area"];
  const photos = listing.photos && listing.photos.length > 0
    ? listing.photos
    : [
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
      ];

  return (
    <div style={{ position: "relative", height, overflow: "hidden", background: "#1F1D2B" }}>
      <img
        src={photos[idx]}
        alt={`${listing.name} - ${labels[idx] || "Photo"}`}
        referrerPolicy="no-referrer"
        loading="eager"
        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "all .3s" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 45%, rgba(0,0,0,0.3) 100%)", pointerEvents: "none" }} />
      
      <div style={{ position: "absolute", bottom: 14, left: 16, zIndex: 2 }}>
        <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: 999, fontWeight: 600, backdropFilter: "blur(4px)" }}>
          📷 {labels[idx] || `Photo ${idx + 1}`} ({idx + 1}/{photos.length})
        </span>
      </div>

      {/* dots */}
      <div style={{ position: "absolute", bottom: 14, right: 16, display: "flex", gap: 6, zIndex: 2 }}>
        {photos.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 999, background: i === idx ? "#fff" : "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", transition: "all .2s", padding: 0 }} />
        ))}
      </div>

      {/* arrows */}
      {idx > 0 && <button onClick={() => setIdx(i => i - 1)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.88)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}><ChevronLeft size={18} color="#241016" /></button>}
      {idx < photos.length - 1 && <button onClick={() => setIdx(i => i + 1)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.88)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}><ChevronRight size={18} color="#241016" /></button>}
    </div>
  );
}

/* ══════════════════════════════════════
   LISTING CARD
══════════════════════════════════════ */
function ListingCard({ l, onOpen, onSave }) {
  const mobile = useIsMobile();
  const thumb = l.photos?.[0] || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";

  return (
    <div onClick={() => onOpen(l)} style={{ background: "#fff", borderRadius: 18, border: "1px solid #F0DEDD", cursor: "pointer", overflow: "hidden", boxShadow: "0 2px 12px rgba(46,10,22,.07)", transition: "box-shadow .2s, transform .2s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 36px rgba(46,10,22,.14)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(46,10,22,.07)"; e.currentTarget.style.transform = "translateY(0)"; }}>

      {/* Image thumbnail strip */}
      <div style={{ height: 160, position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${l.accent}dd, #241016)` }}>
        <img
          src={thumb}
          alt={l.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)", pointerEvents: "none" }} />
        
        {/* Save */}
        <button type="button" onClick={e => { e.stopPropagation(); onSave(l.id); }}
          style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,.18)", zIndex: 2 }}>
          <Heart size={16} fill={l.saved ? "#E84393" : "none"} color={l.saved ? "#E84393" : "#8C6B70"} />
        </button>

        {/* Badges */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4, flexWrap: "wrap", zIndex: 2 }}>
          <Pill color="#fff" bg={l.accent} border="transparent">{l.type}</Pill>
          {l.gender !== "Any" && <Pill color="#fff" bg={l.gender === "Women" ? "#9B4EA0" : "#2D6A8F"} border="transparent">{l.gender}</Pill>}
        </div>
        {l.verified && <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 2 }}><Pill color="#16A34A" bg="#DCFCE7" border="#BBF7D0">✓ Verified</Pill></div>}
        {l.rating >= 4.6 && <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 2 }}><Pill color="#92400E" bg="#FEF3C7" border="#FDE68A">⭐ Top Rated</Pill></div>}
      </div>

      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
          <p style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 15, color: "#241016", lineHeight: 1.3 }}>{l.name}</p>
        </div>
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#8C6B70", display: "flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
          <MapPin size={11} /> {l.area} · {l.distanceKm} km to campus
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Stars rating={l.rating} size={11} />
          <span style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#6B7280", fontWeight: 500 }}>{l.rating} ({l.reviews} reviews)</span>
        </div>
        {/* Amenities */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {l.amenities.slice(0, 3).map(a => {
            const Icon = AMENITY_ICONS[a];
            return (
              <span key={a} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, fontFamily: "Inter,sans-serif", color: "#5B1526", background: "#FBEEEC", padding: "3px 8px", borderRadius: 999, border: "1px solid #EADCD9" }}>
                {Icon && <Icon size={9} />} {a}
              </span>
            );
          })}
          {l.amenities.length > 3 && <span style={{ fontSize: 10.5, color: "#8C6B70", background: "#F6EDEC", padding: "3px 8px", borderRadius: 999, border: "1px solid #E8DCE0", fontFamily: "Inter,sans-serif" }}>+{l.amenities.length - 3}</span>}
        </div>
        {/* Price */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 20, fontWeight: 700, color: "#2E0A16" }}>₹{l.rent.toLocaleString("en-IN")}</span>
            <span style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70" }}>/mo</span>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 10.5, color: "#8C6B70" }}>₹{l.deposit.toLocaleString("en-IN")} deposit</p>
          </div>
          <button onClick={e => { e.stopPropagation(); onOpen(l); }}
            style={{ padding: "8px 16px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   DETAIL PAGE
══════════════════════════════════════ */
function DetailPage({ listing: l, onBack, onSave, onBook, onJoinWaitlist }) {
  const mobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("overview");
  const sections = ["overview", "rooms", "amenities", "reviews"];

  return (
    <div style={{ background: "#FFFDFB", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Gallery */}
      <div style={{ position: "relative" }}>
        <Gallery listing={l} height={mobile ? 220 : 300} />
        <button onClick={onBack} style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
          <ArrowLeft size={18} color="#241016" />
        </button>
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
          <button onClick={() => onSave(l.id)} style={{ background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
            <Heart size={17} fill={l.saved ? "#E84393" : "none"} color={l.saved ? "#E84393" : "#8C6B70"} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        <div style={{ maxWidth: 740, margin: "0 auto", padding: mobile ? "16px 16px 0" : "24px 24px 0" }}>

          {/* Header */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <Pill color="#fff" bg={l.accent} border="transparent">{l.type}</Pill>
              {l.gender !== "Any" && <Pill color="#fff" bg={l.gender === "Women" ? "#9B4EA0" : "#2D6A8F"} border="transparent">{l.gender} Only</Pill>}
              {l.verified ? <Pill color="#16A34A" bg="#DCFCE7" border="#BBF7D0">✓ Verified</Pill> : <Pill color="#D97706" bg="#FEF3C7" border="#FDE68A">⚠ Unverified</Pill>}
              <Pill color="#92400E" bg="#FEF3C7" border="#FDE68A">⏳ Priority Waitlist Active</Pill>
            </div>
            <h1 style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: mobile ? 22 : 28, color: "#241016", marginBottom: 6, lineHeight: 1.2 }}>{l.name}</h1>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#8C6B70", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
              <MapPin size={13} /> {l.area}, Kopargaon · {l.distanceKm} km from campus
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Stars rating={l.rating} size={13} />
              <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12.5, color: "#374151", fontWeight: 600 }}>{l.rating}</span>
              <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70" }}>· {l.reviews} reviews</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#D4B896" }} />
              <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70" }}>Owner since {l.owner.since}</span>
            </div>
          </div>

          {/* Highlights */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {l.highlights.map(h => (
              <div key={h} style={{ display: "flex", alignItems: "center", gap: 5, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "6px 10px" }}>
                <CheckCircle2 size={13} color="#16A34A" />
                <span style={{ fontFamily: "Inter,sans-serif", fontSize: 11.5, fontWeight: 600, color: "#15803D" }}>{h}</span>
              </div>
            ))}
          </div>

          {/* Rent box with Waitlist & Book Now */}
          <div style={{ background: "#F9F5FF", border: "1.5px solid #E9D5FF", borderRadius: 16, padding: "16px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70", marginBottom: 2 }}>Starting from</p>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 26, fontWeight: 700, color: "#2E0A16", lineHeight: 1 }}>
                ₹{l.rent.toLocaleString("en-IN")}<span style={{ fontSize: 13, fontWeight: 400, color: "#8C6B70", fontFamily: "Inter,sans-serif" }}>/mo</span>
              </p>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#8C6B70", marginTop: 2 }}>
                + ₹{l.deposit.toLocaleString("en-IN")} refundable deposit (in escrow)
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => onJoinWaitlist(l)}
                style={{ padding: "11px 18px", background: "#FAF0EE", color: "#5B1526", border: "1.5px solid #5B1526", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s" }}>
                <Clock size={15} /> ⏳ Join Waitlist Queue
              </button>
              <button
                onClick={onBook}
                style={{ padding: "11px 22px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={15} /> Instant Book
              </button>
            </div>
          </div>

          {/* Section tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #F0DEDD", marginBottom: 20, overflowX: "auto" }}>
            {sections.map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                style={{ padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: activeSection === s ? "#5B1526" : "#8C6B70", borderBottom: `2px solid ${activeSection === s ? "#5B1526" : "transparent"}`, marginBottom: -2, whiteSpace: "nowrap", textTransform: "capitalize" }}>
                {s === "overview" ? "Overview" : s === "rooms" ? "Room Types" : s === "amenities" ? "Amenities" : "Reviews"}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeSection === "overview" && (
            <div>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 20 }}>{l.desc}</p>

              {/* Nearby colleges */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 600, color: "#241016", marginBottom: 10 }}>Nearby Colleges</h3>
                {l.nearbyColleges.map(c => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #F6EDEC" }}>
                    <Navigation2 size={13} color="#5B1526" />
                    <span style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#374151" }}>{c}</span>
                  </div>
                ))}
              </div>

              {/* House rules */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 600, color: "#241016", marginBottom: 10 }}>House Rules</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {l.rules.map(r => (
                    <div key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#374151", fontFamily: "Inter,sans-serif" }}>
                      <X size={11} color="#DC2626" style={{ flexShrink: 0 }} /> {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* Owner card */}
              <div style={{ background: "#FBEEEC", border: "1px solid #EADCD9", borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 15, fontWeight: 600, color: "#241016", marginBottom: 12 }}>Owner / Manager</h3>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: l.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={24} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "Fraunces,serif", fontWeight: 600, fontSize: 15, color: "#241016" }}>{l.owner.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Stars rating={l.owner.rating} size={11} />
                      <span style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70" }}>{l.owner.rating} owner rating</span>
                    </div>
                    <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#8C6B70", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} /> {l.owner.responseTime}
                    </p>
                  </div>
                  <TrustRing score={l.ownerScore} size={44} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <a href={`tel:+91${l.owner.phone.replace(/\s/g, "")}`} style={{ flex: 1, textDecoration: "none" }}>
                    <button style={{ width: "100%", padding: "9px 0", background: "#fff", color: "#5B1526", border: "1.5px solid #5B1526", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Phone size={13} /> {l.owner.phone}
                    </button>
                  </a>
                  <button style={{ flex: 1, padding: "9px 0", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <MessageCircle size={13} /> Message
                  </button>
                </div>
              </div>

              {/* Unverified warning */}
              {!l.verified && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10, marginBottom: 20 }}>
                  <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12.5, color: "#92400E", lineHeight: 1.5 }}>
                    This listing is <strong>not yet verified</strong> by NESTRO. Please visit in person and verify documents before paying any deposit.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Room Types */}
          {activeSection === "rooms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {l.roomTypes.map(r => (
                <div key={r.type} style={{ background: "#fff", border: "1.5px solid #F0DEDD", borderRadius: 14, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <p style={{ fontFamily: "Fraunces,serif", fontWeight: 600, fontSize: 15, color: "#241016" }}>{r.type}</p>
                      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", marginTop: 2 }}>{r.size} · {r.available} {r.available === 1 ? "bed" : "beds"} available</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 18, color: "#2E0A16" }}>₹{r.rent.toLocaleString("en-IN")}</p>
                      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 10.5, color: "#8C6B70" }}>/month</p>
                    </div>
                  </div>
                  {r.available > 0
                    ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A" }} /><span style={{ fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#16A34A", fontWeight: 600 }}>{r.available} {r.available === 1 ? "bed" : "beds"} available</span></div>
                    : <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }} /><span style={{ fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#DC2626", fontWeight: 600 }}>Fully occupied · Priority Waitlist Open</span></div>
                  }
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => onJoinWaitlist(l, r.type)}
                      style={{ flex: 1, padding: "9px 0", background: "#FAF0EE", color: "#5B1526", border: "1.5px solid #5B1526", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Clock size={13} /> ⏳ Waitlist Queue
                    </button>
                    {r.available > 0 && (
                      <button
                        onClick={onBook}
                        style={{ flex: 1, padding: "9px 0", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                        Instant Book
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Amenities */}
          {activeSection === "amenities" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {l.amenities.map(a => {
                const Icon = AMENITY_ICONS[a] || Sparkles;
                return (
                  <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FBEEEC", borderRadius: 12, border: "1px solid #EADCD9" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#5B1526", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} color="#fff" />
                    </div>
                    <span style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "#241016" }}>{a}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reviews */}
          {activeSection === "reviews" && (
            <div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20, background: "#FBEEEC", borderRadius: 16, padding: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "Fraunces,serif", fontSize: 40, fontWeight: 700, color: "#241016", lineHeight: 1 }}>{l.rating}</p>
                  <Stars rating={l.rating} size={14} />
                  <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70", marginTop: 4 }}>{l.reviews} reviews</p>
                </div>
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map(s => {
                    const count = l.reviewsList.filter(r => Math.round(r.rating) === s).length;
                    const pct = l.reviewsList.length ? (count / l.reviewsList.length) * 100 : 0;
                    return (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "#8C6B70", width: 6 }}>{s}</span>
                        <Star size={9} fill="#F59E0B" color="#F59E0B" />
                        <div style={{ flex: 1, height: 4, background: "#F0DEDD", borderRadius: 999 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "#C9A24B", borderRadius: 999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {l.reviewsList.map((r, i) => (
                <div key={i} style={{ borderTop: i > 0 ? "1px solid #F0DEDD" : "none", paddingTop: i > 0 ? 16 : 0, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: l.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={16} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "#241016" }}>{r.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Stars rating={r.rating} size={10} />
                        <span style={{ fontFamily: "Inter,sans-serif", fontSize: 10.5, color: "#8C6B70" }}>{r.date}</span>
                      </div>
                    </div>
                    <ThumbsUp size={13} color="#8C6B70" style={{ marginLeft: "auto" }} />
                  </div>
                  <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Book CTA */}
      <div style={{ position: "sticky", bottom: 0, background: "#FFFDFB", borderTop: "1px solid #F0DEDD", padding: "12px 20px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 18, color: "#2E0A16", margin: 0 }}>₹{l.rent.toLocaleString("en-IN")}<span style={{ fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 400, color: "#8C6B70" }}>/mo</span></p>
          <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#166534", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
            <span>🛡️ ₹99 Trust &amp; Escrow Guarantee</span>
          </p>
        </div>
        <button onClick={onBook} style={{ padding: "13px 28px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(91,21,38,0.25)" }}>
          <Zap size={15} /> Book Now
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   LEGAL MODAL (TERMS & POLICIES)
══════════════════════════════════════ */
function LegalModal({ initialTab = "terms", onClose }) {
  const [tab, setTab] = useState(initialTab);
  const mobile = useIsMobile();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? 12 : 24, animation: "fadeIn .2s ease-out" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(24,8,13,0.65)", backdropFilter: "blur(6px)" }} />
      
      {/* Modal Dialog */}
      <div style={{ position: "relative", width: "100%", maxWidth: 660, maxHeight: "90vh", background: "#FFFDFB", borderRadius: 24, border: "1px solid #EADCD9", boxShadow: "0 28px 70px -15px rgba(46,10,22,0.45)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid #F0DEDD", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFDFB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#5B1526", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              ⚖️
            </div>
            <div>
              <p style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 700, color: "#241016", margin: 0, lineHeight: 1.2 }}>NESTRO Legal &amp; Policies</p>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: "3px 0 0" }}>Verified Student Housing Standards · v2.4 (August 2026)</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, borderRadius: "50%", background: "#F6EDEC", border: "1px solid #EADCD9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5B1526", transition: "background .15s" }}>
            <X size={18} />
          </button>
        </div>

        {/* Modern Segmented Tab Bar */}
        {/* Modern Segmented Tab Bar */}
        <div style={{ padding: "10px 24px", background: "#FBF3F2", borderBottom: "1px solid #F0DEDD", overflowX: "auto" }}>
          <div style={{ display: "flex", background: "#EFE3E1", borderRadius: 12, padding: 3, gap: 4, minWidth: 460 }}>
            {[
              { id: "revenue", icon: "💼", label: "Business Model" },
              { id: "terms", icon: "📜", label: "Terms of Service" },
              { id: "privacy", icon: "🔒", label: "Privacy Policy" },
              { id: "escrow", icon: "🛡️", label: "Escrow & Refunds" }
            ].map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "9px 12px",
                    borderRadius: 9,
                    border: "none",
                    background: active ? "#5B1526" : "transparent",
                    color: active ? "#ffffff" : "#6E4C52",
                    fontFamily: "Inter,sans-serif",
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 600,
                    cursor: "pointer",
                    boxShadow: active ? "0 2px 8px rgba(91,21,38,0.25)" : "none",
                    transition: "all .15s ease",
                    whiteSpace: "nowrap"
                  }}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 30px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#3D2429", lineHeight: 1.75 }}>
          
          {/* TAB 0: REVENUE & BUSINESS MODEL */}
          {tab === "revenue" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#FBEEEC", border: "1px solid #EADCD9", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 12 }}>
                <span style={{ fontSize: 22 }}>💡</span>
                <div>
                  <p style={{ margin: "0 0 2px", fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#5B1526" }}>
                    Core Philosophy: 0% Brokerage for Students
                  </p>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#6E4C52", lineHeight: 1.5 }}>
                    NESTRO is 100% free for students to browse, compare, visit, and book stays. Monetization happens sustainably through property owners, premium visibility boosts, and value-added rental services.
                  </p>
                </div>
              </div>

              <div>
                <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 15, fontWeight: 700, color: "#241016", margin: "0 0 6px" }}>
                  1️⃣ Property Owner Success &amp; Occupancy Fee (B2B)
                </h4>
                <p style={{ margin: 0, color: "#4A3237", fontSize: 13 }}>
                  Hostel &amp; PG owners pay a flat <strong>₹500 – ₹1,000 (or 3%–5% of 1st month rent)</strong> per filled bed. Local offline brokers charge 15–30 days of rent (₹4,000+), making NESTRO 4x cheaper and far more reliable for property owners.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 15, fontWeight: 700, color: "#241016", margin: "0 0 6px" }}>
                  2️⃣ Featured &amp; Spotlight Ad Subscriptions (B2B)
                </h4>
                <p style={{ margin: 0, color: "#4A3237", fontSize: 13 }}>
                  Property owners pay <strong>₹1,500 – ₹3,000 / month</strong> during admission season for guaranteed Top 3 search placement, <em>⭐ Verified Partner</em> gold badge, and NEST AI smart recommendations.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 15, fontWeight: 700, color: "#241016", margin: "0 0 6px" }}>
                  3️⃣ Student Trust, Move-In &amp; Agreement Fee (Micro B2C)
                </h4>
                <p style={{ margin: 0, color: "#4A3237", fontSize: 13 }}>
                  A nominal <strong>₹99 convenience fee</strong> on confirmed bookings provides students with secure Escrow deposit protection, instant downloadable Digital Tenancy Agreement PDF, and a Zero Brokerage certificate.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 15, fontWeight: 700, color: "#241016", margin: "0 0 6px" }}>
                  4️⃣ NESTRO "HostelOS" Property Management SaaS (B2B)
                </h4>
                <p style={{ margin: 0, color: "#4A3237", fontSize: 13 }}>
                  A lightweight <strong>₹499 – ₹799 / month</strong> subscription for hostel owners providing automated WhatsApp rent due reminders, digital rent receipt generators, and curfew entry logs.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: TERMS OF SERVICE */}
          {tab === "terms" && (
            <div>
              {/* Highlight Box */}
              <div style={{ background: "#FDF4E7", border: "1px solid #FCD34D", borderRadius: 14, padding: "14px 18px", marginBottom: 22, display: "flex", gap: 12 }}>
                <span style={{ fontSize: 20 }}>🎓</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#92400E", fontSize: 13 }}>Student-First Rental Charter</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#78350F", lineHeight: 1.5 }}>
                    Zero brokerage, non-discriminatory access, transparent contracts, and 100% verified campus housing across India.
                  </p>
                </div>
              </div>

              {/* Section 01 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>01</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>Student Eligibility &amp; Identity Verification</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  NESTRO is an exclusive residential marketplace for college students, interns, and early career graduates. By creating an account, you affirm that all submitted educational and identity credentials represent your authentic profile.
                </p>
              </div>

              {/* Section 02 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>02</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>Listing Accuracy &amp; Host Obligations</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  All listings on NESTRO must reflect accurate room dimensions, actual photos, realistic amenities (Wi-Fi bandwidth, meal options, power backup), and transparent monthly rental rates. Unannounced rent hikes or bait-and-switch listings lead to immediate host de-listing.
                </p>
              </div>

              {/* Section 03 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>03</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>Community Code of Conduct &amp; Safety</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  Residents are expected to observe host house policies regarding quiet study hours, visitor registration, and campus safety guidelines. Harassment, unauthorized subletting, or hazardous conduct will result in immediate termination of the tenancy agreement.
                </p>
              </div>

              {/* Section 04 */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>04</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>Portable Student Trust Score™ System</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  Your NESTRO Trust Score (300–850) dynamically improves with verified tenancy, on-time rent transactions, and positive host testimonials. High-tier scores qualify students for Zero-Deposit move-ins and preferential rates throughout your university tenure.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {tab === "privacy" && (
            <div>
              {/* Highlight Box */}
              <div style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 14, padding: "14px 18px", marginBottom: 22, display: "flex", gap: 12 }}>
                <span style={{ fontSize: 20 }}>🛡️</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#065F46", fontSize: 13 }}>Strict Zero-Spam Guarantee</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#047857", lineHeight: 1.5 }}>
                    Your personal phone number and academic data will never be traded, shared with third-party real estate brokers, or sold to spammers.
                  </p>
                </div>
              </div>

              {/* Section 01 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>01</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>Data Collected &amp; Purpose</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  We collect basic registration details (Full name, student email, academic institution, move-in preferences) solely to curate personalized listings near your campus and verify tenant eligibility.
                </p>
              </div>

              {/* Section 02 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>02</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>256-Bit Financial &amp; KYC Encryption</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  All payment transactions (UPI, Net Banking, Cards) are processed via RBI-authorized payment gateways using end-to-end TLS 1.3 cryptographic protection. NESTRO never stores raw card CVVs or net banking PINs.
                </p>
              </div>

              {/* Section 03 */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>03</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>Right to Data Portability &amp; Erasure</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  You retain full ownership of your data. Students can request an export of their tenancy history and Trust Score certificates, or request complete account erasure directly from settings at any time.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ESCROW & REFUND POLICY */}
          {tab === "escrow" && (
            <div>
              {/* Highlight Box */}
              <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 14, padding: "14px 18px", marginBottom: 22, display: "flex", gap: 12 }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#1E40AF", fontSize: 13 }}>Safe Move-In Escrow Guarantee</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#1D4ED8", lineHeight: 1.5 }}>
                    Your deposit stays in a neutral escrow account until you move in and physically verify the property.
                  </p>
                </div>
              </div>

              {/* Section 01 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>01</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>How NESTRO Escrow Works</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  Upon booking a room, your advance rent and security deposit are deposited into a dedicated escrow vault. The funds are disbursed to the property host <b>only after you check in, inspect the premises, and approve move-in completion</b>.
                </p>
              </div>

              {/* Section 02 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>02</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>24-Hour Listing Mismatch Money-Back Policy</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  If the room substantially differs from the photographic representation or lacks promised key amenities (e.g. non-functional washrooms, missing bed/wardrobe, faulty locks), you may file a claim within 24 hours of arrival for a <b>100% immediate refund</b> or free priority transfer to an alternative verified PG.
                </p>
              </div>

              {/* Section 03 */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#5B1526", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace" }}>03</span>
                  <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>Deposit Refund on Tenancy Completion</h4>
                </div>
                <p style={{ margin: 0, color: "#4A3237" }}>
                  Upon completing your lease duration with standard 30-day notice, your security deposit is released back to your bank account within <b>7 business days</b>, protecting you from unlawful deductions.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #F0DEDD", background: "#FFFDFB", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8C6B70" }}>
            <span>📞 Questions?</span>
            <button onClick={() => alert("Student Grievance Officer: legal@nestro.in | 1800-NESTRO-SAFE")} style={{ background: "none", border: "none", color: "#5B1526", fontWeight: 700, cursor: "pointer", fontSize: 12, padding: 0, textDecoration: "underline" }}>
              Contact Student Grievance
            </button>
          </div>
          <button onClick={onClose}
            style={{ padding: "11px 26px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(91,21,38,0.25)", transition: "transform .15s ease" }}>
            I Understand &amp; Agree ✓
          </button>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   AUTH FLOW (LOGIN & SIGN UP)
══════════════════════════════════════ */
function AuthFlow({ onDone }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [state, setState] = useState({ name: "", email: "", college: "", password: "", confirm: "" });
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState("terms");

  function handleChange(field, val) {
    setState(prev => ({ ...prev, [field]: val }));
    if (errors[field] || errors.general) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        delete next.general;
        return next;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    const cleanEmail = state.email.trim().toLowerCase();

    // Check mandatory terms checkbox
    if (!agreedTerms) {
      newErrors.terms = "You must agree to the Terms of Service & Privacy Policy to proceed.";
    }

    if (mode === "signup" && state.name.trim().length < 2) {
      newErrors.name = "Enter your full name.";
    }
    if (mode === "signup" && state.college.trim().length < 2) {
      newErrors.college = "Enter your college or university name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (state.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (mode === "signup" && state.confirm !== state.password) {
      newErrors.confirm = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (mode === "signup") {
        // Real Firebase Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, state.password);
        if (userCredential.user && state.name.trim()) {
          await updateProfile(userCredential.user, {
            displayName: state.name.trim()
          });
        }
        if (state.college.trim()) {
          try {
            localStorage.setItem(`nestro_college_${cleanEmail}`, state.college.trim());
          } catch (e) {}
        }
        setLoading(false);
        setSubmitted(true);
      } else {
        // Real Firebase Login
        await signInWithEmailAndPassword(auth, cleanEmail, state.password);
        setLoading(false);
        setSubmitted(true);
      }
    } catch (err) {
      setLoading(false);
      const code = err.code || "";
      if (code === "auth/email-already-in-use") {
        setErrors({ email: "An account with this email already exists in Firebase. Please log in." });
      } else if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setErrors({ general: "Incorrect email or password. Please check your credentials or create a new account." });
      } else if (code === "auth/invalid-email") {
        setErrors({ email: "Invalid email address format." });
      } else if (code === "auth/weak-password") {
        setErrors({ password: "Password should be at least 6 characters." });
      } else if (code === "auth/too-many-requests") {
        setErrors({ general: "Too many failed attempts. Please wait a moment and try again." });
      } else {
        setErrors({ general: err.message || "Authentication error. Please check your Firebase configuration." });
      }
    }
  }

  function handleContinue() {
    const cleanEmail = state.email.trim().toLowerCase();
    const currentUser = auth.currentUser;
    const userName = state.name.trim() || currentUser?.displayName || cleanEmail.split("@")[0] || "Student";
    const userCollege = state.college.trim() || localStorage.getItem(`nestro_college_${cleanEmail}`) || "Sanjivani University, Kopargaon";
    
    onDone({
      name: userName,
      email: cleanEmail,
      college: userCollege,
      phone: "9834620537",
      moveIn: "2026-09-01"
    });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#F3E7E5", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 410, background: "#FFFDFB", borderRadius: 24, border: "1px solid #EADCD9", boxShadow: "0 20px 50px -30px rgba(46,10,22,0.35)", padding: "38px 32px" }}>
        
        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <img src="/logo.png" alt="NESTRO Logo" style={{ height: 64, objectFit: "contain", borderRadius: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }} />
        </div>

        {!submitted ? (
          <>
            {mode === "login" ? (
              <>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: "#241016", textAlign: "center", margin: "0 0 4px" }}>
                  Welcome back
                </h1>
                <p style={{ fontSize: 13, color: "#8C6B70", textAlign: "center", margin: "0 0 22px" }}>
                  Log in to pick up your search where you left off.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  {errors.general && (
                    <div style={{ background: "#FEE2E2", border: "1.5px solid #F87171", borderRadius: 12, padding: "10px 14px", color: "#991B1B", fontSize: 12.5, marginBottom: 14, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>⚠️</span>
                      <span>{errors.general}</span>
                    </div>
                  )}

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#241016", marginBottom: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12.5 }}>✉️ Email</span>
                    <input
                      type="email"
                      value={state.email}
                      onChange={e => handleChange("email", e.target.value)}
                      placeholder="e.g., yourname@gmail.com"
                      style={{ border: `1.5px solid ${errors.email ? "#B23A3A" : "#EADCD9"}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#241016", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    {errors.email && <span style={{ color: "#B23A3A", fontSize: 11.5, marginTop: -2 }}>{errors.email}</span>}
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#241016", marginBottom: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12.5 }}>🔒 Password</span>
                    <input
                      type="password"
                      value={state.password}
                      onChange={e => handleChange("password", e.target.value)}
                      placeholder="••••••••"
                      style={{ border: `1.5px solid ${errors.password ? "#B23A3A" : "#EADCD9"}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#241016", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    {errors.password && <span style={{ color: "#B23A3A", fontSize: 11.5, marginTop: -2 }}>{errors.password}</span>}
                  </label>

                  <div style={{ textAlign: "right", margin: "-6px 0 14px" }}>
                    <button
                      type="button"
                      onClick={() => alert("Password reset instructions will be sent to your email.")}
                      style={{ background: "none", border: "none", color: "#5B1526", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "'Inter', sans-serif" }}>
                      Forgot password?
                    </button>
                  </div>

                  {/* Mandatory Terms & Policy Checkbox */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer", fontSize: 12, color: "#4A3237", lineHeight: 1.5 }}>
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={e => { setAgreedTerms(e.target.checked); if (errors.terms) setErrors(prev => { const n = {...prev}; delete n.terms; return n; }); }}
                        style={{ accentColor: "#5B1526", width: 16, height: 16, marginTop: 2, cursor: "pointer", flexShrink: 0 }}
                      />
                      <span>
                        I agree to NESTRO's{" "}
                        <button type="button" onClick={(e) => { e.preventDefault(); setLegalTab("terms"); setShowLegal(true); }} style={{ background: "none", border: "none", color: "#5B1526", fontWeight: 700, cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0 }}>
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button type="button" onClick={(e) => { e.preventDefault(); setLegalTab("privacy"); setShowLegal(true); }} style={{ background: "none", border: "none", color: "#5B1526", fontWeight: 700, cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0 }}>
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                    {errors.terms && <p style={{ color: "#B23A3A", fontSize: 11.5, margin: "6px 0 0" }}>{errors.terms}</p>}
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    style={{ background: agreedTerms && !loading ? "#5B1526" : "#8A5460", color: "#fff", border: "none", borderRadius: 999, padding: "12px 22px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s ease" }}>
                    {loading ? "Please wait…" : "Log in →"}
                  </button>
                </form>

                <p style={{ fontSize: 13, color: "#8C6B70", textAlign: "center", marginTop: 18 }}>
                  New to NESTRO?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setErrors({}); }}
                    style={{ background: "none", border: "none", color: "#5B1526", fontWeight: 700, textDecoration: "none", cursor: "pointer", fontSize: 13, padding: 0 }}>
                    Create an account
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: "#241016", textAlign: "center", margin: "0 0 4px" }}>
                  Create your NESTRO account
                </h1>
                <p style={{ fontSize: 13, color: "#8C6B70", textAlign: "center", margin: "0 0 22px" }}>
                  Verified student housing, and a trust score that moves with you.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  {errors.general && (
                    <div style={{ background: "#FEE2E2", border: "1.5px solid #F87171", borderRadius: 12, padding: "10px 14px", color: "#991B1B", fontSize: 12.5, marginBottom: 14, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>⚠️</span>
                      <span>{errors.general}</span>
                    </div>
                  )}

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#241016", marginBottom: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12.5 }}>👤 Full name</span>
                    <input
                      value={state.name}
                      onChange={e => handleChange("name", e.target.value)}
                      placeholder="e.g., Ananya Rao"
                      style={{ border: `1.5px solid ${errors.name ? "#B23A3A" : "#EADCD9"}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#241016", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    {errors.name && <span style={{ color: "#B23A3A", fontSize: 11.5, marginTop: -2 }}>{errors.name}</span>}
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#241016", marginBottom: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12.5 }}>🎓 College / University</span>
                    <input
                      value={state.college}
                      onChange={e => handleChange("college", e.target.value)}
                      placeholder="e.g., Sanjivani University, Kopargaon"
                      style={{ border: `1.5px solid ${errors.college ? "#B23A3A" : "#EADCD9"}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#241016", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    {errors.college && <span style={{ color: "#B23A3A", fontSize: 11.5, marginTop: -2 }}>{errors.college}</span>}
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#241016", marginBottom: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12.5 }}>✉️ Email (Gmail / Personal / College)</span>
                    <input
                      type="email"
                      value={state.email}
                      onChange={e => handleChange("email", e.target.value)}
                      placeholder="e.g., yourname@gmail.com"
                      style={{ border: `1.5px solid ${errors.email ? "#B23A3A" : "#EADCD9"}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#241016", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    {errors.email && <span style={{ color: "#B23A3A", fontSize: 11.5, marginTop: -2 }}>{errors.email}</span>}
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#241016", marginBottom: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12.5 }}>🔒 Password</span>
                    <input
                      type="password"
                      value={state.password}
                      onChange={e => handleChange("password", e.target.value)}
                      placeholder="••••••••"
                      style={{ border: `1.5px solid ${errors.password ? "#B23A3A" : "#EADCD9"}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#241016", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    {errors.password && <span style={{ color: "#B23A3A", fontSize: 11.5, marginTop: -2 }}>{errors.password}</span>}
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#241016", marginBottom: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12.5 }}>🔒 Confirm password</span>
                    <input
                      type="password"
                      value={state.confirm}
                      onChange={e => handleChange("confirm", e.target.value)}
                      placeholder="••••••••"
                      style={{ border: `1.5px solid ${errors.confirm ? "#B23A3A" : "#EADCD9"}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#241016", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    {errors.confirm && <span style={{ color: "#B23A3A", fontSize: 11.5, marginTop: -2 }}>{errors.confirm}</span>}
                  </label>

                  {/* Mandatory Terms & Policy Checkbox */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer", fontSize: 12, color: "#4A3237", lineHeight: 1.5 }}>
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={e => { setAgreedTerms(e.target.checked); if (errors.terms) setErrors(prev => { const n = {...prev}; delete n.terms; return n; }); }}
                        style={{ accentColor: "#5B1526", width: 16, height: 16, marginTop: 2, cursor: "pointer", flexShrink: 0 }}
                      />
                      <span>
                        I agree to NESTRO's{" "}
                        <button type="button" onClick={(e) => { e.preventDefault(); setLegalTab("terms"); setShowLegal(true); }} style={{ background: "none", border: "none", color: "#5B1526", fontWeight: 700, cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0 }}>
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button type="button" onClick={(e) => { e.preventDefault(); setLegalTab("privacy"); setShowLegal(true); }} style={{ background: "none", border: "none", color: "#5B1526", fontWeight: 700, cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0 }}>
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                    {errors.terms && <p style={{ color: "#B23A3A", fontSize: 11.5, margin: "6px 0 0" }}>{errors.terms}</p>}
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    style={{ background: agreedTerms && !loading ? "#5B1526" : "#8A5460", color: "#fff", border: "none", borderRadius: 999, padding: "12px 22px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", width: "100%", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s ease" }}>
                    {loading ? "Please wait…" : "Create account →"}
                  </button>
                </form>

                <p style={{ fontSize: 13, color: "#8C6B70", textAlign: "center", marginTop: 18 }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setErrors({}); }}
                    style={{ background: "none", border: "none", color: "#5B1526", fontWeight: 700, textDecoration: "none", cursor: "pointer", fontSize: 13, padding: 0 }}>
                    Log in
                  </button>
                </p>
              </>
            )}

            <p style={{ fontSize: 11, color: "#B7999C", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
              NESTRO Verified Student Housing Network
            </p>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#5B1526", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>
              ✓
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: "#241016", margin: "0 0 6px" }}>
              {mode === "login" ? "Logged in" : `Welcome to NESTRO, ${state.name.split(" ")[0] || "there"}!`}
            </h1>
            <p style={{ fontSize: 13, color: "#8C6B70", margin: "0 0 20px" }}>
              {mode === "login"
                ? "Good to see you again — your search and trust score are right where you left them."
                : "Your account has been created. Next, let's find your place."}
            </p>
            <button
              onClick={handleContinue}
              style={{ background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, padding: "12px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              Continue to search →
            </button>
            <p style={{ fontSize: 13, color: "#8C6B70", textAlign: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setErrors({}); }}
                style={{ background: "none", border: "none", color: "#5B1526", fontWeight: 700, cursor: "pointer", fontSize: 13, padding: 0 }}>
                {mode === "login" ? "Not you? Create a new account" : "Back to log in"}
              </button>
            </p>
          </div>
        )}

      </div>
      {showLegal && <LegalModal initialTab={legalTab} onClose={() => setShowLegal(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════
   BOOKING FLOW
══════════════════════════════════════ */
function BookingFlow({ listing: l, user, onBack, onConfirm }) {
  const [step, setStep] = useState(0); // 0=select room, 1=details, 2=payment, 3=done
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [moveIn, setMoveIn] = useState(user?.moveIn || "");
  const [months, setMonths] = useState(6);
  const mobile = useIsMobile();
  const baseDeposit = selectedRoom?.deposit || (selectedRoom ? selectedRoom.rent * 2 : 0);
  const total = selectedRoom ? selectedRoom.rent + baseDeposit + 99 : 0;

  const StepBar = () => (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", background: "#FFFDFB", borderBottom: "1px solid #F0DEDD" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", marginRight: 12, display: "flex" }}>
        <ArrowLeft size={20} color="#241016" />
      </button>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70" }}>Booking</p>
        <p style={{ fontFamily: "Fraunces,serif", fontWeight: 600, fontSize: 14, color: "#241016" }}>{l.name}</p>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {["Room", "Details", "Pay", "Done"].map((s, i) => (
          <div key={s} style={{ width: i <= step ? 20 : 6, height: 6, borderRadius: 999, background: i <= step ? "#5B1526" : "#F0DEDD", transition: "width .2s" }} />
        ))}
      </div>
    </div>
  );

  // Step 3: Confirmed
  if (step === 3) return (
    <div style={{ minHeight: "100%", background: "#FFFDFB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <CheckCircle2 size={40} color="#16A34A" />
      </div>
      <p style={{ fontFamily: "Fraunces,serif", fontSize: 26, fontWeight: 700, color: "#241016", marginBottom: 8 }}>Booking Confirmed! 🎉</p>
      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 14, color: "#8C6B70", marginBottom: 6 }}>You're moving into</p>
      <p style={{ fontFamily: "Fraunces,serif", fontSize: 18, fontWeight: 600, color: "#5B1526", marginBottom: 20 }}>{l.name}</p>
      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 16, padding: 20, marginBottom: 24, width: "100%", maxWidth: 360 }}>
        {[
          ["Room Type", selectedRoom?.type],
          ["Move-in Date", moveIn],
          ["Monthly Rent", `₹${selectedRoom?.rent.toLocaleString("en-IN")}`],
          ["Deposit (Escrow)", `₹${baseDeposit.toLocaleString("en-IN")}`],
          ["🛡️ Trust & Verification Fee", "₹99"],
          ["Total Paid Today", `₹${total.toLocaleString("en-IN")}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: "Inter,sans-serif", fontSize: 13 }}>
            <span style={{ color: "#6B7280" }}>{k}</span>
            <span style={{ fontWeight: 600, color: "#15803D" }}>{v}</span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12.5, color: "#8C6B70", marginBottom: 20 }}>
        📧 Confirmation + digital rental agreement sent to your email.<br />Your Portable Trust Score just went up! 🚀
      </p>
      <button onClick={onConfirm} style={{ padding: "13px 32px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Back to Home
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100%", background: "#FFFDFB", display: "flex", flexDirection: "column" }}>
      <StepBar />
      <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "16px" : "24px 32px", maxWidth: 520, margin: "0 auto", width: "100%" }}>

        {/* Step 0: Select Room */}
        {step === 0 && (
          <>
            <p style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 700, color: "#241016", marginBottom: 4 }}>Select Room Type</p>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#8C6B70", marginBottom: 18 }}>Choose the room that fits your budget</p>
            {l.roomTypes.filter(r => r.available > 0).map(r => (
              <div key={r.type} onClick={() => setSelectedRoom(r)}
                style={{ border: `2px solid ${selectedRoom?.type === r.type ? "#5B1526" : "#F0DEDD"}`, borderRadius: 14, padding: 16, marginBottom: 10, cursor: "pointer", background: selectedRoom?.type === r.type ? "#FBEEEC" : "#fff", transition: "all .15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "Fraunces,serif", fontWeight: 600, fontSize: 15, color: "#241016" }}>{r.type}</p>
                    <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", marginTop: 2 }}>{r.size} · {r.available} available</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 18, color: "#2E0A16" }}>₹{r.rent.toLocaleString("en-IN")}/mo</p>
                    {selectedRoom?.type === r.type && <Check size={16} color="#5B1526" style={{ marginLeft: "auto" }} />}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <>
            <p style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 700, color: "#241016", marginBottom: 4 }}>Move-in Details</p>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#8C6B70", marginBottom: 18 }}>Tell us when you'd like to move in</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600, color: "#8C6B70", display: "block", marginBottom: 6 }}>Move-in Date</label>
                <input type="date" value={moveIn} onChange={e => setMoveIn(e.target.value)} style={{ width: "100%", border: "1.5px solid #EADCD9", borderRadius: 10, padding: "12px 13px", fontFamily: "Inter,sans-serif", fontSize: 14, color: "#241016", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600, color: "#8C6B70", display: "block", marginBottom: 6 }}>Duration (months)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[3, 6, 11, 12].map(m => (
                    <button key={m} onClick={() => setMonths(m)}
                      style={{ flex: 1, padding: "10px 0", border: `2px solid ${months === m ? "#5B1526" : "#EADCD9"}`, borderRadius: 10, background: months === m ? "#5B1526" : "#fff", color: months === m ? "#fff" : "#241016", fontFamily: "Inter,sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: "#FBEEEC", borderRadius: 12, padding: 14, marginTop: 20 }}>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, color: "#5B1526", marginBottom: 6 }}>Selected: {selectedRoom?.type}</p>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70" }}>₹{selectedRoom?.rent.toLocaleString("en-IN")}/mo × {months} months = <strong>₹{(selectedRoom?.rent * months).toLocaleString("en-IN")}</strong></p>
            </div>
          </>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <>
            <p style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 700, color: "#241016", marginBottom: 4 }}>Payment Summary</p>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#8C6B70", marginBottom: 18 }}>Review before confirming</p>
            <div style={{ background: "#fff", border: "1px solid #F0DEDD", borderRadius: 16, padding: 18, marginBottom: 14 }}>
              {[
                ["Room Type", selectedRoom?.type],
                ["First Month Rent", `₹${selectedRoom?.rent.toLocaleString("en-IN")}`],
                ["Security Deposit (Escrow)", `₹${baseDeposit.toLocaleString("en-IN")}`],
                ["🛡️ Student Trust & Verification Fee", "₹99"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F6EDEC", fontFamily: "Inter,sans-serif", fontSize: 13 }}>
                  <span style={{ color: "#6B7280" }}>{k}</span>
                  <span style={{ fontWeight: 600, color: k.includes("Trust") ? "#15803D" : "#241016" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontFamily: "Fraunces,serif", fontSize: 17, fontWeight: 700 }}>
                <span style={{ color: "#241016" }}>Total Due Today</span>
                <span style={{ color: "#5B1526" }}>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10, marginBottom: 14 }}>
              <Lock size={15} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#1E40AF", lineHeight: 1.5, margin: 0 }}>
                Deposit is held in <strong>secure escrow</strong>. The <strong>₹99 Student Trust Fee</strong> guarantees 0% brokerage, instant legal Tenancy Agreement PDF, and 100% money-back move-in protection.
              </p>
            </div>
            <div style={{ border: "1px solid #F0DEDD", borderRadius: 14, padding: 14, marginBottom: 4 }}>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, color: "#8C6B70", marginBottom: 10 }}>PAY VIA</p>
              {[["UPI (GPay, PhonePe, Paytm)", "⚡ Instant"], ["Debit / Credit Card", "Visa / Mastercard"], ["Net Banking", "All major banks"]].map(([m, sub]) => (
                <label key={m} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid #F6EDEC", cursor: "pointer" }}>
                  <input type="radio" name="pay" defaultChecked={m.includes("UPI")} style={{ accentColor: "#5B1526", width: 16, height: 16 }} />
                  <div>
                    <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "#241016" }}>{m}</p>
                    <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70" }}>{sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      {step < 3 && (
        <div style={{ padding: "14px 20px", background: "#FFFDFB", borderTop: "1px solid #F0DEDD" }}>
          {step === 0 && <button disabled={!selectedRoom} onClick={() => setStep(1)} style={{ width: "100%", padding: 13, background: selectedRoom ? "#5B1526" : "#D4A0A8", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 14, cursor: selectedRoom ? "pointer" : "not-allowed" }}>Continue → Move-in Details</button>}
          {step === 1 && <button disabled={!moveIn} onClick={() => setStep(2)} style={{ width: "100%", padding: 13, background: moveIn ? "#5B1526" : "#D4A0A8", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 14, cursor: moveIn ? "pointer" : "not-allowed" }}>Continue → Payment</button>}
          {step === 2 && (
            <button
              onClick={() => {
                try {
                  const bookingData = {
                    bookingId: "BK_" + Date.now(),
                    listingId: l.id,
                    listingName: l.name,
                    listingArea: l.area,
                    roomType: selectedRoom?.type || "Standard Room",
                    userEmail: user?.email || "",
                    userName: user?.name || "",
                    moveInDate: moveIn,
                    months: months,
                    rent: selectedRoom?.rent || 0,
                    totalPaid: total,
                    timestamp: new Date().toISOString(),
                    status: "Confirmed"
                  };
                  setDoc(doc(db, "bookings", bookingData.bookingId), bookingData).catch(() => {});
                } catch (e) {}
                setStep(3);
              }}
              style={{ width: "100%", padding: 13, background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CreditCard size={16} /> Confirm & Pay ₹{total.toLocaleString("en-IN")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   EDIT PROFILE MODAL
══════════════════════════════════════ */
function EditProfileModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    college: user?.college || "Sanjivani University, Kopargaon",
    phone: user?.phone || "9834620537",
    moveIn: user?.moveIn || "2026-09-01"
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(36,16,22,0.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 440, background: "#FFFDFB", borderRadius: 24, border: "1px solid #EADCD9", boxShadow: "0 24px 60px -20px rgba(46,10,22,0.45)", padding: "26px 24px", zIndex: 1, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 700, color: "#241016", margin: 0 }}>Edit Student Profile</h3>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: "2px 0 0" }}>Syncs across all your devices in real-time</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "#F6EDEC", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5B1526" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12 }}>👤 Full Name</span>
            <input
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g., Pratik Thorat"
              required
              style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12 }}>🎓 College / University</span>
            <input
              value={form.college}
              onChange={e => setForm({...form, college: e.target.value})}
              placeholder="e.g., Sanjivani University, Kopargaon"
              style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12 }}>📞 Phone Number</span>
            <input
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="e.g., 9834620537"
              style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#8C6B70", fontSize: 12 }}>📅 Target Move-in</span>
            <input
              type="date"
              value={form.moveIn}
              onChange={e => setForm({...form, moveIn: e.target.value})}
              style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 4,
              padding: "12px 20px",
              background: "#5B1526",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              fontFamily: "Inter,sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}>
            {saving ? "Syncing to Cloud..." : "Save & Sync Across Devices ✓"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   WAITLIST MODAL
══════════════════════════════════════ */
function WaitlistModal({ listing, initialRoomType = "", user, onJoin, onClose }) {
  const [roomType, setRoomType] = useState(initialRoomType || (listing.roomTypes?.[0]?.type || "Any Available Room"));
  const [moveInMonth, setMoveInMonth] = useState("Immediate / Next 15 Days");
  const [joined, setJoined] = useState(false);
  const [assignedRank, setAssignedRank] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    const rank = onJoin(listing, roomType, moveInMonth);
    setAssignedRank(rank);
    setJoined(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(36,16,22,0.65)", backdropFilter: "blur(5px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "#FFFDFB", borderRadius: 24, border: "1px solid #EADCD9", boxShadow: "0 24px 60px -20px rgba(46,10,22,0.5)", padding: "28px 26px", zIndex: 1 }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 700, color: "#241016", margin: 0 }}>
              {joined ? "🎉 Priority Queue Confirmed!" : "⏳ Join Priority Waitlist"}
            </h3>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: "3px 0 0" }}>
              {joined ? "You are registered in line for next opening" : `Get notified instantly when a bed frees up in ${listing.name}`}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "#F6EDEC", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5B1526" }}>
            <X size={17} />
          </button>
        </div>

        {!joined ? (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Property Summary Strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#FAF6F5", borderRadius: 14, border: "1px solid #F0DEDD" }}>
              <img
                src={listing.photos?.[0] || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"}
                alt={listing.name}
                style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: "Fraunces,serif", fontSize: 14, fontWeight: 700, color: "#241016", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{listing.name}</p>
                <p style={{ margin: "2px 0 0", fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#8C6B70" }}>{listing.area}, Kopargaon · ₹{listing.rent.toLocaleString("en-IN")}/mo</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "#FEF3C7", color: "#92400E", fontFamily: "Inter,sans-serif" }}>
                High Demand 🔥
              </span>
            </div>

            {/* Room Type Selector */}
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#241016" }}>
              <span style={{ color: "#8C6B70", fontSize: 12.5 }}>🛏️ Preferred Room Sharing</span>
              <select
                value={roomType}
                onChange={e => setRoomType(e.target.value)}
                style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", background: "#fff", outline: "none" }}
              >
                <option value="Any Available Room">Any Available Room (Fastest opening)</option>
                {listing.roomTypes?.map(r => (
                  <option key={r.type} value={r.type}>{r.type} (₹{r.rent.toLocaleString("en-IN")}/mo)</option>
                ))}
              </select>
            </label>

            {/* Target Move-in Month */}
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#241016" }}>
              <span style={{ color: "#8C6B70", fontSize: 12.5 }}>📅 Expected Move-in Period</span>
              <select
                value={moveInMonth}
                onChange={e => setMoveInMonth(e.target.value)}
                style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", background: "#fff", outline: "none" }}
              >
                <option value="Immediate / Next 15 Days">Immediate / Next 15 Days</option>
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
                <option value="Next Semester (Jan 2027)">Next Semester (Jan 2027)</option>
              </select>
            </label>

            {/* Notification alert details */}
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🔔</span>
              <div>
                <p style={{ margin: 0, fontFamily: "Inter,sans-serif", fontSize: 12.5, fontWeight: 700, color: "#166534" }}>
                  Instant Notification Alert
                </p>
                <p style={{ margin: "2px 0 0", fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#15803D", lineHeight: 1.4 }}>
                  As soon as an occupant vacates, you will receive an instant email to <b>{user?.email || "your registered email"}</b> and an in-app alert with a 24-hour exclusive booking window.
                </p>
              </div>
            </div>

            <button
              type="submit"
              style={{ padding: "13px 20px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .15s" }}>
              <span>Join Priority Waitlist ⏳</span>
            </button>

            <p style={{ margin: 0, textAlign: "center", fontSize: 11, color: "#8C6B70", fontFamily: "Inter,sans-serif" }}>
              🔒 100% Free · No upfront deposit required · Cancel anytime
            </p>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#FAF0EE", border: "3px solid #5B1526", color: "#5B1526", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, margin: "0 auto 16px", fontFamily: "Fraunces,serif" }}>
              #{assignedRank}
            </div>

            <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 19, fontWeight: 700, color: "#241016", margin: "0 0 6px" }}>
              You are #{assignedRank} in Line!
            </h4>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#6E4C52", lineHeight: 1.5, margin: "0 0 16px" }}>
              We've added your priority queue request for <b>{listing.name}</b> ({roomType}). When a resident moves out, you'll be the first to receive the booking invite.
            </p>

            <div style={{ background: "#FAF6F5", border: "1px solid #EADCD9", borderRadius: 12, padding: "12px", textAlign: "left", marginBottom: 18 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#8C6B70", fontFamily: "Inter,sans-serif" }}><b>Alert sent to:</b> {user?.email}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8C6B70", fontFamily: "Inter,sans-serif" }}><b>Target period:</b> {moveInMonth}</p>
            </div>

            <button
              onClick={onClose}
              style={{ width: "100%", padding: "12px 20px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              Done / Got It ✓
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   NOTIFICATIONS MODAL
══════════════════════════════════════ */
function NotificationsModal({ notifications, onMarkAllRead, onDismiss, onClose }) {
  const [filter, setFilter] = useState("all");
  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "waitlist") return n.type === "waitlist";
    return true;
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(36,16,22,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 480, maxHeight: "85vh", background: "#FFFDFB", borderRadius: 24, border: "1px solid #EADCD9", boxShadow: "0 24px 60px -20px rgba(46,10,22,0.45)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid #F0DEDD", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FBEEEC", color: "#5B1526", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🔔
            </div>
            <div>
              <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 19, fontWeight: 700, color: "#241016", margin: 0 }}>
                Notifications &amp; Alerts
              </h3>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: "2px 0 0" }}>
                {unreadCount > 0 ? `${unreadCount} new unread update${unreadCount > 1 ? "s" : ""}` : "All caught up"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                style={{ background: "none", border: "none", color: "#5B1526", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 8px" }}>
                Mark all read ✓
              </button>
            )}
            <button
              onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: "50%", background: "#F6EDEC", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5B1526" }}>
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, padding: "10px 20px", background: "#FAF6F5", borderBottom: "1px solid #F0DEDD", overflowX: "auto" }}>
          {[
            { id: "all", label: `All (${notifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "waitlist", label: "⏳ Waitlists & Vacancies" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: `1.5px solid ${filter === tab.id ? "#5B1526" : "#EADCD9"}`,
                background: filter === tab.id ? "#5B1526" : "#fff",
                color: filter === tab.id ? "#fff" : "#6B585B",
                fontFamily: "Inter,sans-serif",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 16px" }}>
              <span style={{ fontSize: 32 }}>📭</span>
              <p style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: "10px 0 4px" }}>No notifications here</p>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: 0 }}>You will receive real-time alerts for vacancies and bookings.</p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  background: item.read ? "#fff" : "#FAF0EE",
                  border: `1.5px solid ${item.read ? "#F0DEDD" : "#E8B2BC"}`,
                  borderRadius: 16,
                  padding: "14px 16px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  transition: "background .2s"
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: item.read ? "#F6EDEC" : "#5B1526", color: item.read ? "#241016" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {item.icon || "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                    <p style={{ margin: 0, fontFamily: "Inter,sans-serif", fontSize: 13.5, fontWeight: item.read ? 600 : 700, color: "#241016" }}>
                      {item.title}
                    </p>
                    <span style={{ fontSize: 10.5, fontFamily: "Inter,sans-serif", color: "#A88B90", whiteSpace: "nowrap" }}>
                      {item.time}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 6px", fontFamily: "Inter,sans-serif", fontSize: 12, color: "#6E4C52", lineHeight: 1.45 }}>
                    {item.desc}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {!item.read && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#5B1526", fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5B1526" }} /> New Alert
                      </span>
                    )}
                    <button
                      onClick={() => onDismiss(item.id)}
                      style={{ marginLeft: "auto", background: "none", border: "none", color: "#A88B90", fontSize: 11, cursor: "pointer", padding: 0 }}>
                      Dismiss ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", background: "#FAF6F5", borderTop: "1px solid #F0DEDD", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#8C6B70", fontFamily: "Inter,sans-serif" }}>
            ✉️ Real-time notifications are also synced to your registered email
          </p>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   LIST PROPERTY MODAL (COMPREHENSIVE HOST/PG REGISTRATION)
══════════════════════════════════════ */
function ListPropertyModal({ onSubmit, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    type: "Girls Hostel",
    gender: "Women",
    area: "Sanjivani Campus",
    landmark: "",
    distanceKm: "",
    rent: "",
    deposit: "",
    desc: "",
    nearby1: "",
    nearby2: "",
    nearby3: "",
    amenities: [],
    highlight1: "",
    highlight2: "",
    highlight3: "",
    highlight4: "",
    // 3 Photos - all completely empty so owner uploads real photos
    photo1: "",
    photo2: "",
    photo3: "",
    // Room Types - 1 blank room to start
    rooms: [
      { type: "", size: "", rent: "", deposit: "", available: "", occupancy: "" }
    ],
    // Owner / Warden Info
    ownerName: "",
    phone: "",
    responseTime: "Responds in 10 mins",
    sinceYear: "",
    rules: [
      ""
    ]
  });

  const [submitted, setSubmitted] = useState(false);

  const toggleAmenity = (a) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a]
    }));
  };

  const handleTypeChange = (t) => {
    let gender = "Any";
    if (t.includes("Girls") || t.includes("Women")) gender = "Women";
    else if (t.includes("Boys") || t.includes("Men")) gender = "Men";
    setFormData({ ...formData, type: t, gender });
  };

  const handleRoomChange = (index, field, val) => {
    const nextRooms = [...formData.rooms];
    nextRooms[index][field] = val;
    setFormData({ ...formData, rooms: nextRooms });
  };

  const addRoomType = () => {
    setFormData(prev => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        { type: "", size: "", rent: "", deposit: "", available: "", occupancy: "" }
      ]
    }));
  };

  const removeRoomType = (index) => {
    if (formData.rooms.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index)
    }));
  };

  const handleAddRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, ""]
    }));
  };

  const handleRemoveRule = (index) => {
    if (formData.rules.length <= 1) {
      setFormData(prev => ({ ...prev, rules: [""] }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter your property name.");
      setStep(1);
      return;
    }
    if (!formData.ownerName.trim() || !formData.phone.trim()) {
      alert("Please enter owner name and direct contact phone number.");
      setStep(4);
      return;
    }

    const uploadedPhotos = [formData.photo1, formData.photo2, formData.photo3].filter(Boolean);
    if (uploadedPhotos.length === 0) {
      alert("Please upload at least 1 real photo of your property in Step 3.");
      setStep(3);
      return;
    }

    const baseRent = parseInt(formData.rooms[0]?.rent || formData.rent, 10) || 4500;
    const baseDeposit = parseInt(formData.rooms[0]?.deposit || formData.deposit, 10) || 5000;

    const validRules = formData.rules.map(r => r.trim()).filter(Boolean);
    const validHighlights = [formData.highlight1, formData.highlight2, formData.highlight3, formData.highlight4].map(h => h.trim()).filter(Boolean);
    const validNearby = [formData.nearby1, formData.nearby2, formData.nearby3].map(n => n.trim()).filter(Boolean);

    const newProperty = {
      id: Date.now(),
      name: formData.name.trim(),
      type: formData.type,
      gender: formData.gender,
      area: formData.area,
      distanceKm: parseFloat(formData.distanceKm) || 0.5,
      rent: baseRent,
      deposit: baseDeposit,
      rating: 5.0,
      reviews: 1,
      verified: true,
      accent: formData.gender === "Women" ? "#9B4EA0" : formData.gender === "Men" ? "#1E3A8A" : "#047857",
      photos: uploadedPhotos.length === 1 ? [uploadedPhotos[0], uploadedPhotos[0], uploadedPhotos[0]] : uploadedPhotos,
      gradients: [
        "linear-gradient(135deg, #702459 0%, #B84D88 100%)",
        "linear-gradient(135deg, #5B1526 0%, #8C243E 100%)",
        "linear-gradient(135deg, #4A154B 0%, #7E287C 100%)"
      ],
      amenities: formData.amenities.length > 0 ? formData.amenities : ["WiFi", "Meals", "Security"],
      highlights: validHighlights.length > 0 ? validHighlights : [`Located in ${formData.area}`, "Direct Owner Deal (0% Brokerage)", "Verified Student Accommodation"],
      desc: formData.desc.trim() || `${formData.name} is a student accommodation located in ${formData.area}, Kopargaon with direct owner management and student amenities.`,
      nearbyColleges: validNearby.length > 0 ? validNearby : [`Sanjivani Campus Area (${formData.distanceKm || "0.5"} km)`],
      rules: validRules.length > 0 ? validRules : ["Curfew strictly at 10:00 PM", "No smoking or alcohol allowed", "Valid student ID required"],
      owner: {
        name: formData.ownerName.trim(),
        rating: 5.0,
        responseTime: formData.responseTime || "Responds in 10 mins",
        phone: formData.phone.trim(),
        since: formData.sinceYear.trim() || "2026"
      },
      ownerScore: 850,
      roomTypes: formData.rooms.map((r, i) => ({
        type: r.type.trim() || `Room Type #${i + 1}`,
        size: r.size.trim() || "160 sq ft",
        rent: parseInt(r.rent, 10) || baseRent,
        deposit: parseInt(r.deposit, 10) || baseDeposit,
        available: parseInt(r.available, 10) || 4,
        occupancy: r.occupancy.trim() || "Sharing Room"
      })),
      reviewsList: [
        { author: "Verified Host", college: "Property Host", date: "Aug 2026", rating: 5, text: "Newly registered property open for Sanjivani University students." }
      ],
      disputeMetrics: { onTimeRentPct: 100, disputesLogged: 0, avgResolutionDays: 1 }
    };

    onSubmit(newProperty);
    setSubmitted(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(36,16,22,0.68)", backdropFilter: "blur(5px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 620, maxHeight: "92vh", background: "#FFFDFB", borderRadius: 24, border: "1px solid #EADCD9", boxShadow: "0 24px 70px -20px rgba(46,10,22,0.55)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ padding: "16px 22px 14px", borderBottom: "1px solid #F0DEDD", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#FAF0EE", color: "#5B1526", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              🏡
            </div>
            <div>
              <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 19, fontWeight: 700, color: "#241016", margin: 0 }}>
                {submitted ? "🎉 Property Listed Successfully!" : "List Your Hostel / PG on NESTRO"}
              </h3>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: "2px 0 0" }}>
                {submitted ? "Your property is now live with full details for students" : "Register and reach thousands of Sanjivani University students"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "#F6EDEC", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5B1526" }}>
            <X size={17} />
          </button>
        </div>

        {!submitted ? (
          <>
            {/* Step tabs (flexShrink: 0 so never clipped) */}
            <div style={{ display: "flex", borderBottom: "1.5px solid #F0DEDD", background: "#FAF6F5", overflowX: "auto", flexShrink: 0, padding: "4px 8px 0" }}>
              {[
                { s: 1, label: "Basic & Location", num: "1" },
                { s: 2, label: "Room & Rent", num: "2" },
                { s: 3, label: "Photos & Amenities", num: "3" },
                { s: 4, label: "Owner & Rules", num: "4" }
              ].map(item => (
                <button
                  key={item.s}
                  onClick={() => setStep(item.s)}
                  style={{
                    flex: 1,
                    minWidth: 125,
                    padding: "10px 6px",
                    border: "none",
                    background: step === item.s ? "#FFFDFB" : "transparent",
                    borderRadius: "8px 8px 0 0",
                    fontFamily: "Inter,sans-serif",
                    fontSize: 12,
                    fontWeight: step === item.s ? 700 : 500,
                    color: step === item.s ? "#5B1526" : "#7A5C61",
                    borderBottom: `2.5px solid ${step === item.s ? "#5B1526" : "transparent"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    whiteSpace: "nowrap"
                  }}>
                  <span style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: step === item.s ? "#5B1526" : "#E2D0CD",
                    color: step === item.s ? "#fff" : "#7A5C61",
                    fontSize: 10.5,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {item.num}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Form Steps Container */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
              
              {/* STEP 1: Basic Details & Location */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                    <span>🏠 Property Name *</span>
                    <input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Shree Sai Krupa Girls Hostel"
                      style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
                    />
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                      <span>Category</span>
                      <select
                        value={formData.type}
                        onChange={e => handleTypeChange(e.target.value)}
                        style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", background: "#fff", outline: "none" }}>
                        <option value="Girls Hostel">Girls Hostel</option>
                        <option value="Boys Hostel">Boys Hostel</option>
                        <option value="Hostel">Hostel (Co-ed)</option>
                        <option value="PG">Student PG</option>
                        <option value="Flat">Student Flat</option>
                      </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                      <span>Gender Policy</span>
                      <select
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", background: "#fff", outline: "none" }}>
                        <option value="Women">Women Only</option>
                        <option value="Men">Men Only</option>
                        <option value="Any">Any / Co-ed</option>
                      </select>
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                      <span>Locality in Kopargaon</span>
                      <select
                        value={formData.area}
                        onChange={e => setFormData({ ...formData, area: e.target.value })}
                        style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", background: "#fff", outline: "none" }}>
                        {AREAS.filter(a => a !== "All").map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                      <span>Distance to Campus (km)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.distanceKm}
                        onChange={e => setFormData({ ...formData, distanceKm: e.target.value })}
                        placeholder="0.4"
                        style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
                      />
                    </label>
                  </div>

                  <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                    <span>📍 Specific Address / Landmark</span>
                    <input
                      value={formData.landmark}
                      onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="e.g., Near Sanjivani University Gate No. 2, Behind COE Ground"
                      style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                    <span>📝 Overview Description (Shown to students)</span>
                    <textarea
                      rows={3}
                      value={formData.desc}
                      onChange={e => setFormData({ ...formData, desc: e.target.value })}
                      placeholder="Describe room light, ventilation, quiet study vibe, food quality, solar water, etc."
                      style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13, color: "#241016", outline: "none", resize: "none" }}
                    />
                  </label>

                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#241016", display: "block", marginBottom: 6 }}>
                      🏫 Nearby Colleges &amp; Transport Hubs
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        value={formData.nearby1}
                        onChange={e => setFormData({ ...formData, nearby1: e.target.value })}
                        placeholder="e.g., Sanjivani University (0.4 km)"
                        style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "Inter,sans-serif", color: "#241016" }}
                      />
                      <input
                        value={formData.nearby2}
                        onChange={e => setFormData({ ...formData, nearby2: e.target.value })}
                        placeholder="e.g., Sanjivani College of Engineering (0.3 km)"
                        style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "Inter,sans-serif", color: "#241016" }}
                      />
                      <input
                        value={formData.nearby3}
                        onChange={e => setFormData({ ...formData, nearby3: e.target.value })}
                        placeholder="e.g., Kopargaon Railway Station (2.5 km)"
                        style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "Inter,sans-serif", color: "#241016" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Room Types & Inventory */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: 0 }}>
                        Configure Room Types &amp; Pricing
                      </h4>
                      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: "2px 0 0" }}>
                        Specify rents, sharing types, and available beds for each room category.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addRoomType}
                      style={{ padding: "6px 12px", background: "#FAF0EE", color: "#5B1526", border: "1.5px solid #5B1526", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                      + Add Room Type
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {formData.rooms.map((room, idx) => (
                      <div key={idx} style={{ background: "#FAF6F5", border: "1px solid #EADCD9", borderRadius: 14, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <span style={{ fontFamily: "Fraunces,serif", fontSize: 14, fontWeight: 700, color: "#5B1526" }}>
                            Room #{idx + 1}
                          </span>
                          {formData.rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRoomType(idx)}
                              style={{ background: "none", border: "none", color: "#DC2626", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                              Delete ✕
                            </button>
                          )}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, marginBottom: 10 }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#241016" }}>
                            <span>Room Type Title</span>
                            <input
                              value={room.type}
                              onChange={e => handleRoomChange(idx, "type", e.target.value)}
                              placeholder="e.g., Triple Sharing Deluxe"
                              style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "Inter,sans-serif", background: "#fff" }}
                            />
                          </label>

                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#241016" }}>
                            <span>Room Size</span>
                            <input
                              value={room.size}
                              onChange={e => handleRoomChange(idx, "size", e.target.value)}
                              placeholder="e.g., 180 sq ft"
                              style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "Inter,sans-serif", background: "#fff" }}
                            />
                          </label>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#241016" }}>
                            <span>Rent / Bed (₹)</span>
                            <input
                              type="number"
                              value={room.rent}
                              onChange={e => handleRoomChange(idx, "rent", e.target.value)}
                              placeholder="4500"
                              style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "Inter,sans-serif", background: "#fff" }}
                            />
                          </label>

                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#241016" }}>
                            <span>Deposit (₹)</span>
                            <input
                              type="number"
                              value={room.deposit}
                              onChange={e => handleRoomChange(idx, "deposit", e.target.value)}
                              placeholder="5000"
                              style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "Inter,sans-serif", background: "#fff" }}
                            />
                          </label>

                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#241016" }}>
                            <span>Available Beds</span>
                            <input
                              type="number"
                              value={room.available}
                              onChange={e => handleRoomChange(idx, "available", e.target.value)}
                              placeholder="4"
                              style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "Inter,sans-serif", background: "#fff" }}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Photos, Amenities & Highlights */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#241016", margin: "0 0 2px" }}>
                      📸 Upload Real Photos of Your Property
                    </h4>
                    <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: "0 0 12px" }}>
                      Upload real photos directly from your phone or computer. Students will view these on your Details page.
                    </p>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { key: "photo1", label: "🛏️ Room View Photo", sub: "Show beds, wardrobes, and ventilation" },
                        { key: "photo2", label: "📚 Study & Desk Area Photo", sub: "Show study tables, chairs, and lighting" },
                        { key: "photo3", label: "🍲 Dining & Mess Area Photo", sub: "Show dining area and water/kitchen setup" }
                      ].map(p => (
                        <div key={p.key} style={{ background: "#FAF6F5", border: "1.5px dashed #EADCD9", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                            {formData[p.key] ? (
                              <img src={formData[p.key]} alt={p.label} style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", border: "1.5px solid #5B1526", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }} />
                            ) : (
                              <div style={{ width: 60, height: 60, borderRadius: 10, background: "#FAF0EE", color: "#5B1526", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                                📷
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 700, color: "#241016" }}>
                                {p.label}
                              </p>
                              <p style={{ margin: "2px 0 0", fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70" }}>
                                {formData[p.key] ? "✓ Real Photo Uploaded" : p.sub}
                              </p>
                            </div>
                          </div>

                          <label style={{ padding: "8px 16px", background: formData[p.key] ? "#FAF0EE" : "#5B1526", color: formData[p.key] ? "#5B1526" : "#fff", border: formData[p.key] ? "1.5px solid #5B1526" : "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                            <span>{formData[p.key] ? "Change 🔄" : "+ Upload Photo 📁"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = ev => {
                                  setFormData(prev => ({ ...prev, [p.key]: ev.target.result }));
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#241016", display: "block", marginBottom: 8 }}>
                      ✨ Amenities (Select all available)
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                      {[
                        "WiFi", "Meals", "Security", "Study Room",
                        "Solar Hot Water", "RO Purified Water", "Power Backup", "Parking",
                        "Laundry", "AC", "Daily Housekeeping", "CCTV"
                      ].map(a => {
                        const active = formData.amenities.includes(a);
                        return (
                          <button
                            type="button"
                            key={a}
                            onClick={() => toggleAmenity(a)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: `1.5px solid ${active ? "#5B1526" : "#EADCD9"}`,
                              background: active ? "#FAF0EE" : "#fff",
                              color: active ? "#5B1526" : "#4A3237",
                              fontFamily: "Inter,sans-serif",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: 6
                            }}>
                            <span>{active ? "✓" : "+"}</span> {a}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#241016", display: "block", marginBottom: 6 }}>
                      ⭐ Key Highlights (Shown on top of Details page)
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <input
                        value={formData.highlight1}
                        onChange={e => setFormData({ ...formData, highlight1: e.target.value })}
                        placeholder="Highlight 1"
                        style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif" }}
                      />
                      <input
                        value={formData.highlight2}
                        onChange={e => setFormData({ ...formData, highlight2: e.target.value })}
                        placeholder="Highlight 2"
                        style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif" }}
                      />
                      <input
                        value={formData.highlight3}
                        onChange={e => setFormData({ ...formData, highlight3: e.target.value })}
                        placeholder="Highlight 3"
                        style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif" }}
                      />
                      <input
                        value={formData.highlight4}
                        onChange={e => setFormData({ ...formData, highlight4: e.target.value })}
                        placeholder="Highlight 4"
                        style={{ border: "1px solid #EADCD9", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "Inter,sans-serif" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Owner / Warden Contact & House Rules */}
              {step === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                      <span>👤 Owner / Warden Full Name *</span>
                      <input
                        value={formData.ownerName}
                        onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                        placeholder="e.g., Mr. Sanjay Patil"
                        style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                      <span>📞 Direct Phone Number *</span>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g., 98220 12345"
                        style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
                      />
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                      <span>⚡ Inquiry Response Time</span>
                      <select
                        value={formData.responseTime}
                        onChange={e => setFormData({ ...formData, responseTime: e.target.value })}
                        style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", background: "#fff", outline: "none" }}>
                        <option value="Responds in 10 mins">Responds in 10 mins</option>
                        <option value="Responds in 30 mins">Responds in 30 mins</option>
                        <option value="Responds in 1 hour">Responds in 1 hour</option>
                      </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "#241016" }}>
                      <span>Operating Since</span>
                      <input
                        value={formData.sinceYear}
                        onChange={e => setFormData({ ...formData, sinceYear: e.target.value })}
                        placeholder="2024"
                        style={{ border: "1.5px solid #EADCD9", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#241016", outline: "none" }}
                      />
                    </label>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#241016" }}>
                        📜 House Rules (Curfew, Visitors, Quiet hours)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddRule}
                        style={{ padding: "4px 10px", background: "#FAF0EE", color: "#5B1526", border: "1px solid #5B1526", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        + Add Rule
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {formData.rules.map((rule, rIdx) => (
                        <div key={rIdx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(rIdx)}
                            style={{ background: "none", border: "none", color: "#DC2626", fontSize: 14, cursor: "pointer", padding: "0 4px" }}>
                            ✕
                          </button>
                          <input
                            value={rule}
                            placeholder={`e.g., Curfew at 10 PM / Valid ID required`}
                            onChange={e => {
                              const nextRules = [...formData.rules];
                              nextRules[rIdx] = e.target.value;
                              setFormData({ ...formData, rules: nextRules });
                            }}
                            style={{ flex: 1, border: "1px solid #EADCD9", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "Inter,sans-serif" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🛡️</span>
                    <div>
                      <p style={{ margin: 0, fontFamily: "Inter,sans-serif", fontSize: 12.5, fontWeight: 700, color: "#166534" }}>Zero Brokerage Direct Listing Guarantee</p>
                      <p style={{ margin: "2px 0 0", fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#15803D", lineHeight: 1.45 }}>
                        Once submitted, students can instantly view all your photos, compare rents per bed, join your priority waitlist, and contact you directly without middleman cuts.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Navigation */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid #F0DEDD", background: "#FAF6F5", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  style={{ padding: "9px 20px", background: "#fff", border: "1.5px solid #EADCD9", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "#241016", cursor: "pointer" }}>
                  ← Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !formData.name.trim()) {
                      alert("Please enter your property name.");
                      return;
                    }
                    setStep(step + 1);
                  }}
                  style={{ padding: "10px 24px", background: "#5B1526", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                  Next Step ({step + 1}/4) →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{ padding: "11px 28px", background: "#16A34A", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 13.5, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }}>
                  <span>Publish Property Live 🚀</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "36px 24px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 16px" }}>
              ✓
            </div>
            <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 24, fontWeight: 700, color: "#241016", margin: "0 0 8px" }}>
              {formData.name} is Live!
            </h4>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#6E4C52", lineHeight: 1.55, margin: "0 0 22px", maxWidth: 460, marginInline: "auto" }}>
              All room types, prices, photo gallery, amenities, and owner contact details are now published on NESTRO for Sanjivani University students.
            </p>

            <button
              onClick={onClose}
              style={{ width: "100%", maxWidth: 320, padding: "12px 24px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", margin: "0 auto", display: "block" }}>
              View Full Details Page 🔍
            </button>
          </div>
        )}

      </div>
    </div>
  );
}



/* ══════════════════════════════════════
   NEST AI ASSISTANT (SUPERCHARGED CAMPUS AI 3.0)
══════════════════════════════════════ */
function generateNextAIResponse(userQuery, listings, user) {
  const q = userQuery.toLowerCase().trim();
  const userName = user?.name ? user.name.split(" ")[0] : "Student";

  // 00. Business & Revenue Model Intent ("revenue", "business model", "paise kaise kamate ho", "how do you make money", "monetization")
  if (
    q.includes("revenue") || q.includes("business model") || q.includes("paise kaise") ||
    q.includes("monetiz") || q.includes("how do you make money") || q.includes("how does nestro earn") ||
    q.includes("earning") || q.includes("income") || q.includes("profit")
  ) {
    return {
      text: `### 💼 NESTRO Revenue & Business Model (Pure Housing Focus):\n\nNESTRO operates on a **0% Brokerage Model for Students** with sustainable **B2B & Value-Added Streams**:\n\n1. 🏢 **Property Owner Booking Fee (B2B)**: ₹500–₹1,000 flat occupancy fee per filled bed (Owners save ₹4,000+ vs offline brokers).\n2. ⭐ **Featured & Spotlight Boosts (B2B)**: ₹1,500–₹3,000/mo for Top 3 search placement and verified gold badges during admission season.\n3. 🛡️ **Student Trust & Agreement Fee (B2C)**: ₹99 micro-fee for Escrow deposit protection and instant Tenancy Agreement PDF.\n4. 📲 **NESTRO HostelOS SaaS (B2B)**: ₹499–₹799/mo subscription for hostel owners with automated WhatsApp rent reminders and curfew attendance.`,
      recommendations: listings.slice(0, 2),
      followUps: ["Why should owners list on NESTRO?", "How does 0% brokerage work for students?", "Explore verified student stays"]
    };
  }
  // 0. Emotional Support, Sadness, Homesickness, Stress, Loneliness ("hey i m sad", "feeling low", "homesick")
  if (
    q.includes("sad") || q.includes("feeling down") || q.includes("lonely") ||
    q.includes("homesick") || q.includes("ghar ki yaad") || q.includes("gharcha aathvan") ||
    q.includes("crying") || q.includes("depress") || q.includes("stress") ||
    q.includes("tension") || q.includes("anxiety") || q.includes("upset") ||
    q.includes("tired") || q.includes("exhausted") || q.includes("low") ||
    q.includes("scared") || q.includes("not good") || q.includes("bad mood")
  ) {
    return {
      text: `### 💙 Hey ${userName}, I'm here for you:\n\nI'm so sorry you're feeling this way right now. Living away from family and adjusting to college life in Kopargaon can be tough and emotionally overwhelming sometimes — but please remember that **you are never alone**! 🫂✨\n\nHere are some gentle things that might bring you comfort right now:\n\n- 📞 **Call Home or a Best Friend**: Take 5 minutes to hear a familiar, loving voice.\n- 🌿 **Take a Breath & Walk**: A short stroll to the Sanjivani Campus Ground, Godavari river bank, or the quiet temple garden can help clear your mind.\n- ☕ **Warm Tea or Coffee**: Grab hot ginger tea and a quick snack at Godavari Tea Point or Campus Canteen.\n- 🤝 **Talk to your Roommate / Warden**: Sharing how you feel with your hostel warden (e.g. Mrs. Shailaja Patil at Narayani) or room partner helps tremendously.\n- 🏥 **Sanjivani Student Wellness**: The campus counseling and health center is available 24/7 inside the campus.\n\n*If you ever want to talk about finding a quieter room, comfortable study corners, or just need campus guidance, I'm always right here!*`,
      recommendations: listings.slice(0, 2),
      followUps: ["Tell me something uplifting ✨", "Where are quiet study spots on campus?", "Hostels with caring wardens", "Tell me a joke 😄"]
    };
  }

  // 0b. Motivation, Uplifting Quotes & Campus Humor ("tell me a joke", "motivate me", "bored")
  if (
    q.includes("joke") || q.includes("motivat") || q.includes("inspire") ||
    q.includes("quote") || q.includes("bored") || q.includes("bore") ||
    q.includes("funny") || q.includes("cheer") || q.includes("laugh")
  ) {
    return {
      text: `### ✨ Here's a Little Boost for You, ${userName}! 🌟\n\n> *"You don't have to have everything figured out right now. Just take one day, one lecture, and one semester at a time."*\n\n**Here's a quick campus joke for you:**\n*Why did the engineering student cross the road?*\n*Because there was free high-speed WiFi on the other side and the hostel inverter was at 2%!* 😂📶\n\nRemember: Every senior and faculty member at Sanjivani started right where you are now. You're going to do great! 🚀`,
      recommendations: listings.slice(0, 2),
      followUps: ["Tell me another joke 😄", "Where to get best chai near campus?", "Calculate monthly living budget", "Sanjivani Campus & Gate Guide"]
    };
  }

  // 0c. Food, Mess, Chai & Student Hangouts ("where to eat", "best chai", "mess food", "canteen")
  if (
    q.includes("food") || q.includes("eat") || q.includes("mess") ||
    q.includes("chai") || q.includes("tea") || q.includes("coffee") ||
    q.includes("canteen") || q.includes("khana") || q.includes("nashta") ||
    q.includes("jevan") || q.includes("restaurant") || q.includes("cafe")
  ) {
    return {
      text: `### 🍲 Best Food & Chai Spots around Sanjivani Campus:\n\n- **☕ Chai & Snacks**: Godavari Tea Point outside Gate 1 & SRES Canteen (Famous for hot Poha, Misal Pav & Chai).\n- **🍲 Student Messes (Monthly ₹2,200 – ₹2,600)**:\n  - **Annapurna Pure Veg Mess**: Near College Road (Homestyle unlimited thali).\n  - **Sai Bhojanalaya**: Opposite Gate 2.\n- **🍕 Evening Hangouts**: College Road Cafes & Station Road Bakeries.\n- **🚰 Purified Drinking Water**: All NESTRO verified hostels feature RO drinking water systems.`,
      recommendations: listings.slice(0, 2),
      followUps: ["Which hostels include mess in rent?", "Calculate monthly living cost", "Girls Hostels near Sanjivani COE"]
    };
  }

  // 1. Specific Property Inquiries (Narayani, Trividha, Major House, Sai Tirupati, Shivneri, Radhika)
  if (q.includes("narayani")) {
    const p = listings.find(l => l.name.toLowerCase().includes("narayani")) || listings[0];
    return {
      text: `### 🌸 Narayani Girls Hostel (Opposite Campus):\n\n- **📍 Location**: Sanjivani Campus Road (Just **0.4 km / 3 min walk** to Gate 1).\n- **💰 Rent**: Triple Sharing from **₹4,500/mo** | Twin Deluxe **₹5,200/mo** | Single **₹6,800/mo**.\n- **🛡️ Safety & Warden**: In-house warden **Mrs. Shailaja Patil** (Rating 4.9⭐) with 24/7 CCTV & biometric gate entry.\n- **⏰ Curfew**: 9:30 PM (Special late library pass allowed during exam weeks).\n- **✨ Key Highlights**: Pure RO water, solar hot water 24/7, high-speed WiFi, silent study zones.\n- **0% Brokerage**: Direct owner booking via NESTRO.`,
      recommendations: [p],
      followUps: ["How to book Narayani Girls Hostel?", "What is the curfew time for Narayani?", "Show Twin Sharing options"]
    };
  }

  if (q.includes("trividha")) {
    const p = listings.find(l => l.name.toLowerCase().includes("trividha")) || listings[1];
    return {
      text: `### 🌸 Trividha Girls Hostel (College Road):\n\n- **📍 Location**: College Road (0.6 km to Sanjivani University & Pharmacy College).\n- **💰 Rent**: Standard Double Sharing **₹4,800/mo** | Triple Economy **₹4,200/mo**.\n- **🛡️ Safety**: 24/7 CCTV surveillance, female warden **Mrs. Sunita**.\n- **✨ Amenities**: Silent study library hall, daily housekeeping, inverter power backup, solar water.\n- **⏰ Curfew**: 9:00 PM in-time rule.`,
      recommendations: [p],
      followUps: ["Compare Narayani vs Trividha", "Show budget stays under ₹4,500", "Direct owner contact for Trividha"]
    };
  }

  if (q.includes("major house") || q.includes("major")) {
    const p = listings.find(l => l.name.toLowerCase().includes("major")) || listings[2];
    return {
      text: `### ⚡ Major House Boys Hostel (Sanjivani Campus):\n\n- **📍 Location**: Near Sanjivani COE & Sports Grounds (**0.5 km**).\n- **💰 Rent**: Triple Sharing **₹4,000/mo** | Double Sharing Deluxe **₹4,500/mo**.\n- **👑 Management**: Captain R. Jadhav (Major) — 4.7⭐ rating.\n- **✨ Features**: High-speed WiFi for project work, two-wheeler covered parking, balcony rooms, power inverter.\n- **⏰ Timing**: 11:00 PM quiet hours.`,
      recommendations: [p],
      followUps: ["Show Double Sharing Deluxe rooms", "How to call Captain Jadhav?", "Boys hostels near Station Road"]
    };
  }

  if (q.includes("sai tirupati") || q.includes("tirupati") || q.includes("sai")) {
    const p = listings.find(l => l.name.toLowerCase().includes("tirupati")) || listings[1];
    return {
      text: `### ⚡ Sai Tirupati Boys Hostel (College Road):\n\n- **📍 Location**: College Road (**0.7 km** from Sanjivani University).\n- **💰 Rent**: Starting from **₹4,400/month** (Deposit: ₹4,500).\n- **✨ Features**: Fiber WiFi, study desks with power sockets, inverter backup, parking, CCTV security.\n- **0% Brokerage**: Speak directly with manager without middleman fees.`,
      recommendations: [p],
      followUps: ["Compare with Major House Boys Hostel", "Show stays under ₹4,500", "Schedule a free property visit"]
    };
  }

  // 2. Property Comparisons ("compare", "which is better", "diff between")
  if (q.includes("compare") || q.includes("difference") || q.includes("which is better") || q.includes("vs") || q.includes("konsa acha")) {
    return {
      text: `### ⚖️ Top Hostel Comparisons in Kopargaon:\n\n**🌸 For Female Students**:\n- **Narayani Girls Hostel**: Closest to Gate 1 (0.4 km) | ₹4,500/mo | In-house warden | 4.8⭐\n- **Trividha Girls Hostel**: College Road (0.6 km) | ₹4,800/mo | Dedicated silent study hall | 4.7⭐\n\n**⚡ For Male Students**:\n- **Major House Boys Hostel**: Near COE (0.5 km) | ₹4,000–₹4,500/mo | Balconies & WiFi | 4.6⭐\n- **Sai Tirupati Boys Hostel**: College Road (0.7 km) | ₹4,400/mo | Fast fiber internet | 4.8⭐\n\n*All options on NESTRO offer 0% Brokerage & Direct Warden Contact.*`,
      recommendations: listings.slice(0, 3),
      followUps: ["Show budget stays under ₹4,500", "Which hostels have 24/7 reading rooms?", "Show Double Sharing rooms"]
    };
  }

  // 3. 2-Room / Twin Sharing / Double Sharing Search
  if (q.includes("2room") || q.includes("2 room") || q.includes("two room") || q.includes("double") || q.includes("twin") || q.includes("2 bed") || q.includes("2 sharing") || q.includes("2bed") || q.includes("double sharing")) {
    const twinMatches = listings.filter(l => l.roomTypes && l.roomTypes.some(rt => rt.type.toLowerCase().includes("double") || rt.type.toLowerCase().includes("twin") || rt.type.toLowerCase().includes("2") || rt.type.toLowerCase().includes("two")));
    const recs = twinMatches.length > 0 ? twinMatches : listings;
    return {
      text: `### 🛏️ Double Sharing & 2-Bed Deluxe Rooms:\n\nHere are top verified properties offering spacious **Twin Deluxe / Double Sharing Rooms** near Sanjivani Campus:\n\n- **Rent Range**: ₹4,200 – ₹5,200/month per student.\n- **Room Setup**: 2 separate wooden beds, individual study desks, lockable wardrobes, and attached bathrooms.\n- **Power Backup**: Inverter support for uninterrupted study.\n- **0% Brokerage**: Direct owner connection with zero booking commission.`,
      recommendations: recs.slice(0, 3),
      followUps: ["Compare Double Sharing rents", "Show rooms near Gate 1", "How to contact the hostel owner directly?"]
    };
  }

  // 4. Single Private Rooms
  if (q.includes("single") || q.includes("private") || q.includes("1 room") || q.includes("1 bed") || q.includes("alone") || q.includes("personal")) {
    return {
      text: `### 🚪 Single Private Student Rooms in Kopargaon:\n\n- **Private Single Rooms**: Best for students who want dedicated quiet study space without roommates.\n- **Rent Range**: **₹6,000 – ₹7,200/month** (Includes private desk, wardrobe, solar hot water, WiFi & power backup).\n- **Availability**: Limited private rooms per property. Check vacancies early before term start!`,
      recommendations: listings.slice(0, 2),
      followUps: ["Show Narayani Single Room details", "Compare Single vs Twin sharing rent", "Join Priority Waitlist for single rooms"]
    };
  }

  // 5. General PG / Hostel Search ("where can i find pg", "want to find pg", "how to find pg", "room chahiye")
  if (
    q.includes("want to find") || q.includes("where can i find") || q.includes("where to find") ||
    q.includes("how to find") || q.includes("search pg") || q.includes("find pg") ||
    q.includes("find hostel") || q.includes("pg chahiye") || q.includes("hostel chahiye") ||
    q.includes("room chahiye") || q.includes("kahan milega") || q.includes("pg bhetel") ||
    (q.includes("find") && q.includes("pg")) || (q.includes("search") && q.includes("hostel"))
  ) {
    return {
      text: `### 🏠 Finding Verified PGs & Hostels on NESTRO:\n\nFinding your student stay in Kopargaon is simple:\n\n1. **Explore Stays**: Browse all verified properties with transparent rent prices, photo galleries, and real student reviews.\n2. **Filter by Campus Distance**: Find stays within **300m – 700m** of Sanjivani University & COE gates.\n3. **1-Click Call Owner**: Tap **'Call Owner'** on any listing to schedule a free property visit or check room availability.\n4. **Priority Waitlist**: Join queues for free if popular hostels are full.\n\n*Here are the top accommodations available right now:*`,
      recommendations: listings.slice(0, 3),
      followUps: ["Show Girls Hostels near Sanjivani COE", "Show Boys PGs under ₹4,500/mo", "Calculate Monthly Living Cost"]
    };
  }

  // 6. Property Listing & Owner Registration ("where can i list my property", "how to list property", "add pg")
  if (
    q.includes("list my property") || q.includes("list property") || q.includes("list pg") ||
    q.includes("list hostel") || q.includes("add property") || q.includes("add pg") ||
    q.includes("add hostel") || q.includes("register property") || q.includes("owner registration") ||
    q.includes("post property") || q.includes("upload property") || (q.includes("list") && q.includes("property"))
  ) {
    return {
      text: `### 🏡 Listing Your PG / Hostel on NESTRO:\n\nListing your student accommodation on NESTRO is **100% Free** and takes less than 2 minutes:\n\n1. **Tap '+ List PG / Hostel'** at the top right of your screen (or **'+ List Property 🏡'** in the left sidebar).\n2. **Fill Property Details**:\n   - Property Name, Area (e.g. Sanjivani Campus, College Road, Station Road).\n   - Gender type (Men / Women / Co-ed).\n   - Monthly rent & security deposit.\n   - Room types (Single, Twin, Triple sharing).\n   - Amenities (WiFi, Inverter, Solar Water, Two-Wheeler Parking).\n   - Real photos & Owner Contact number.\n3. **Publish Live 🚀**: Your listing goes live immediately for thousands of Sanjivani University students with **0% Brokerage**!`,
      recommendations: listings.slice(0, 2),
      followUps: ["How do students contact owners?", "Are there any listing charges?", "Show verified accommodations"]
    };
  }

  // 7. Financial Difficulties / Payment Delay / "Can you wait for some days?" / Money tight
  if (
    q.includes("money") || q.includes("paisa") || q.includes("paise") || q.includes("rupee") ||
    q.includes("wait") || q.includes("some days") || q.includes("few days") || q.includes("cant pay") ||
    q.includes("can't pay") || q.includes("dont have") || q.includes("don't have") || q.includes("late pay") ||
    q.includes("delay") || q.includes("afford") || q.includes("problem") || q.includes("financial") ||
    q.includes("installment") || q.includes("concession") || q.includes("discount") || q.includes("kiti paisa")
  ) {
    const budgetListings = [...listings].sort((a, b) => a.rent - b.rent);
    return {
      text: `### 💙 We Completely Understand Student Financial Situations:\n\nDon't worry, ${userName}! College expenses can be tight. Here is how NESTRO and hostel owners accommodate your situation:\n\n- **⏳ Free Priority Waitlist**: You can join a queue and hold a room reservation **without paying any advance deposit** right now.\n- **🤝 Direct Owner Payment Extension**: NESTRO connects you directly with hostel owners/wardens. You can request a **3 to 7-day payment window** or monthly installment splits without any penalties.\n- **💰 Low-Cost Triple Sharing**: We have verified student stays in Kopargaon starting from just **₹${budgetListings[0]?.rent || 3800}/month** with low security deposits.\n- **✨ 0% Brokerage Guarantee**: You never pay any middleman fees, commission, or booking charges on NESTRO.\n\n*Would you like to browse our most budget-friendly stays or connect directly with an owner?*`,
      recommendations: budgetListings.slice(0, 3),
      followUps: ["Show stays under ₹4,500/month", "How to contact the hostel owner directly?", "What is the security deposit amount?"]
    };
  }

  // 8. Roommates & Friends Group Booking
  if (q.includes("roommate") || q.includes("friend") || q.includes("dost") || q.includes("group") || q.includes("together") || q.includes("share with") || q.includes("room partner") || q.includes("sobat")) {
    return {
      text: `### 👥 Staying with Friends & Roommate Arrangements:\n\n- **Stay in the Same Room**: You and your friends can book twin or triple rooms together in the same property.\n- **Group Visits**: You can schedule a joint visit to inspect room ventilation, beds, study desks, and attached washrooms before confirming.\n- **Split Living Costs**: Shared rooms reduce your per-person monthly expense to as low as **₹3,800 – ₹4,500/mo**!`,
      recommendations: listings.slice(0, 2),
      followUps: ["Show Twin Deluxe options", "Show Triple Sharing hostels", "Hostels near Sanjivani COE"]
    };
  }

  // 9. Late Night / Curfew / Gate Timings / Study Hours
  if (q.includes("curfew") || q.includes("timing") || q.includes("late") || q.includes("night") || q.includes("raat") || q.includes("entry") || q.includes("permission") || q.includes("gate pass")) {
    return {
      text: `### 🌙 Curfew & Late-Night Study Policies in Kopargaon:\n\n- **Standard Gate Timings**: Usually **9:30 PM – 10:00 PM** for Girls Hostels and **10:30 PM – 11:00 PM** for Boys Hostels.\n- **Exam & Library Late Pass**: During semester exams, wardens permit late entry with college library ID or advance intimation.\n- **Parental Intimation**: For weekend leaves or extended travel, simple warden call/SMS confirmation ensures safety.`,
      recommendations: listings.slice(0, 2),
      followUps: ["Which hostels have 24/7 reading rooms?", "Girls Hostels with in-house warden", "Hostels within walking distance to campus"]
    };
  }

  // 10. Direct Owner Contact & Physical Visits
  if (q.includes("call") || q.includes("contact") || q.includes("number") || q.includes("visit") || q.includes("phone") || q.includes("talk") || q.includes("dekhna") || q.includes("baat") || q.includes("meet") || q.includes("owner")) {
    return {
      text: `### 📞 Direct Owner Contact & Physical Room Visits:\n\n- **Direct 1-Click Call**: Open any accommodation card and tap **'Call Owner'** to speak directly with verified wardens and property managers.\n- **100% Free Visits**: You can visit and inspect the room, mattress quality, solar hot water pressure, WiFi speed, and study environment before paying anything.\n- **Zero Middleman**: No brokers, registration fees, or hidden commission.`,
      recommendations: listings.slice(0, 3),
      followUps: ["Show nearest hostels to Gate 2", "Compare rents of top 3 PGs", "How does 0% brokerage work?"]
    };
  }

  // 11. Vacating / Refund / Security Deposit / Notice Period
  if (q.includes("leave") || q.includes("vacate") || q.includes("refund") || q.includes("notice") || q.includes("quit") || q.includes("chhodna") || q.includes("wapas") || q.includes("deposit refund")) {
    return {
      text: `### 🛡️ Vacating & Security Deposit Refund Rules:\n\n- **Notice Period**: Standard 15 to 30-day advance notice before vacating at semester end.\n- **Deposit Refund**: Security deposit (₹3,000–₹5,000) is refunded directly via UPI or bank transfer within **24–48 hours** after room inspection.\n- **NESTRO Support Mediation**: Our student support team assists you directly in case of any owner delays.`,
      recommendations: listings.slice(0, 2),
      followUps: ["How to contact student support?", "View verified accommodations", "How does booking work?"]
    };
  }

  // 12. Expense / Budget Calculator Mode
  if (q.includes("calc") || q.includes("expense") || q.includes("monthly") || q.includes("kharcha") || q.includes("total cost") || q.includes("budget calc") || q.includes("cost of living") || q.includes("budget")) {
    const budgetListings = [...listings].sort((a, b) => a.rent - b.rent);
    return {
      text: `### 🧮 Monthly Student Living Cost in Kopargaon (Estimate):\n\nHere is a realistic budget for a student studying at **Sanjivani University / COE**:\n\n- **🛏️ Shared PG / Hostel Rent**: ₹4,000 – ₹5,200/mo (Includes WiFi, Solar Water & Inverter)\n- **⚡ Electricity / Submeter**: ₹150 – ₹300/mo\n- **🛵 Local Transport & Snacks**: ₹800 – ₹1,200/mo\n- **✨ NESTRO Brokerage**: **₹0 (Zero)**\n\n**Total Estimated Monthly Budget**: **₹5,500 – ₹7,500 / month**.\n\n*Tip: Triple sharing rooms save up to ₹1,500/mo compared to single private rooms!*`,
      recommendations: budgetListings.slice(0, 3),
      followUps: ["Show budget stays under ₹4,500", "Compare Single vs Twin sharing rent", "Boys PGs with WiFi & Inverter"]
    };
  }

  // 13. Sanjivani Campus & Kopargaon Local Guide
  if (q.includes("campus") || q.includes("guide") || q.includes("library") || q.includes("hospital") || q.includes("station") || q.includes("train") || q.includes("auto") || q.includes("xerox") || q.includes("print") || q.includes("kopargaon") || q.includes("location") || q.includes("shirdi")) {
    return {
      text: `### 🎓 Sanjivani University & Kopargaon Student Guide:\n\n- **🏫 Campus Gates**:\n  - **Gate 1**: Near SRES Main Admin, Mechanical & Comp Sci Depts.\n  - **Gate 2**: Near Sanjivani University Main Building & COE Ground.\n- **📚 Central Library**: Open **8:00 AM – 10:30 PM** with high-speed WiFi & AC study cubicles.\n- **🚆 Kopargaon Railway Station (KPG)**: 2.5 km away. Auto fare is ₹20–₹30 (shared) or ₹80 (private).\n- **🏥 Health & Clinic**: Sanjivani Rural Health Center is inside the campus + 24/7 chemist available outside Gate 1.\n- **🖨️ Xerox & Project Printing**: College Road Market (₹1/page for lab reports).\n- **🛕 Shirdi Temple**: 18 km away (state buses & shared autos every 15 mins).`,
      recommendations: [...listings].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 2),
      followUps: ["Hostels within 500m of Gate 2", "Which hostels have 24/7 study rooms?", "Hostels near Station Road"]
    };
  }

  // 14. Girls Hostels & PGs
  if (q.includes("girl") || q.includes("female") || q.includes("women") || q.includes("ladki") || q.includes("ladies")) {
    const matches = listings.filter(l => l.gender === "Women" || l.type.toLowerCase().includes("girl"));
    const recs = matches.length > 0 ? matches : listings;
    return {
      text: `### 🌸 Verified Girls Hostels & PGs near Sanjivani Campus:\n\nAll verified female student properties provide:\n- **🛡️ 24/7 Security & CCTV Coverage** with registered in-house female wardens\n- **🚪 Biometric Access & Safe Gate Curfew** (9:30 PM – 10:00 PM)\n- **☀️ 24/7 Solar Hot Water & RO Purified Water**\n- **⚡ Power Inverter Backup & High-Speed WiFi**`,
      recommendations: recs.slice(0, 3),
      followUps: ["Compare Narayani vs Trividha", "Curfew policies for girls hostels", "What is the security deposit amount?"]
    };
  }

  // 15. Boys Hostels & PGs
  if (q.includes("boy") || q.includes("male") || q.includes("men") || q.includes("ladka") || q.includes("gents")) {
    const matches = listings.filter(l => l.gender === "Men" || l.type.toLowerCase().includes("boy"));
    const recs = matches.length > 0 ? matches : listings;
    return {
      text: `### ⚡ Verified Boys Hostels & Student PGs in Kopargaon:\n\nTop accommodations featuring:\n- **📶 High-Speed WiFi** for engineering & coding projects\n- **⚡ Inverter Power Backup** during study hours\n- **🛵 Dedicated Two-Wheeler Parking**\n- **0% Brokerage Direct Owner Connect**`,
      recommendations: recs.slice(0, 3),
      followUps: ["Show budget stays under ₹4,500", "Find boys hostels near Station Road", "Which PGs have two-wheeler parking?"]
    };
  }

  // 16. Furnishing & Amenities (WiFi, Inverter, Solar Water, Study Table)
  if (q.includes("amenity") || q.includes("amenities") || q.includes("wifi") || q.includes("inverter") || q.includes("solar") || q.includes("hot water") || q.includes("furnished") || q.includes("table") || q.includes("bed") || q.includes("facility")) {
    return {
      text: `### 🛋️ Fully Furnished PGs & Hostel Facilities in Kopargaon:\n\nAll verified student properties on NESTRO provide:\n- **📶 High-Speed WiFi**: Dedicated router access for online classes & coding projects.\n- **⚡ Inverter Power Backup**: Uninterrupted power for fans, lights, and study desks.\n- **☀️ 24/7 Hot Water**: Solar water heating systems installed.\n- **🛏️ Comfortable Bedding & Wardrobes**: Individual beds, foam mattresses, lockable cupboards, and study tables.`,
      recommendations: listings.slice(0, 3),
      followUps: ["Show Boys PGs with WiFi & Inverter", "Show Girls Hostels near Sanjivani COE", "What are the curfew hours?"]
    };
  }

  // 17. Distance & Proximity to Campus / Gates
  if (q.includes("near") || q.includes("distance") || q.includes("closest") || q.includes("pass") || q.includes("gate") || q.includes("walking") || q.includes("coe") || q.includes("sanjivani") || q.includes("dur")) {
    const nearest = [...listings].sort((a, b) => a.distanceKm - b.distanceKm);
    return {
      text: `### 📍 Accommodations Closest to Sanjivani Campus:\n\nThese verified hostels are located within **0.3 km to 0.8 km** (a 3 to 6 minute walk) from Sanjivani University & COE gates, saving daily travel time and auto fares:`,
      recommendations: nearest.slice(0, 3),
      followUps: ["Show directions to Gate No. 2", "Which hostels have two-wheeler parking?", "Hostels near Kopargaon Railway Station"]
    };
  }

  // 18. Priority Waitlist & Availability
  if (q.includes("waitlist") || q.includes("queue") || q.includes("full") || q.includes("available") || q.includes("waiting") || q.includes("que") || q.includes("vacancy") || q.includes("seat")) {
    return {
      text: `### ⏳ NESTRO Priority Waitlist System:\n\n1. **High Demand Queue**: When popular hostels are 100% full, join the Priority Waitlist for free.\n2. **Transparent Token**: You receive a FIFO queue position (e.g. *#1 in Queue*).\n3. **Automated Notification**: As soon as a student vacates or moves out, high-priority in-app and email alerts notify you immediately.\n4. **100% Free**: No advance booking deposit required to hold your queue spot!`,
      recommendations: listings.slice(0, 2),
      followUps: ["Where can I see my active waitlists?", "What is the average waitlist clearance time?", "Find hostels with immediate vacancy"]
    };
  }

  // 19. Safety, Security & Anti-Ragging
  if (q.includes("safe") || q.includes("security") || q.includes("warden") || q.includes("cctv") || q.includes("ragging") || q.includes("protection")) {
    return {
      text: `### 🛡️ Student Safety & Anti-Ragging Standards:\n\n- **Verified Properties**: All listed accommodations have verified ownership, registered wardens, and 24/7 CCTV surveillance.\n- **Zero-Tolerance Anti-Ragging**: Strict campus safety compliance.\n- **24/7 Helpline**: Direct access to NESTRO student support and local campus security.`,
      recommendations: listings.slice(0, 2),
      followUps: ["Girls Hostels with 24/7 Warden", "Find stays within 500m of campus", "What is the curfew time?"]
    };
  }

  // 20. Friendly Greetings & Conversational Questions ("hi", "hello", "kaise ho", "kasa ahes", "thank you", "who are you")
  if (q === "hi" || q === "hello" || q === "hey" || q.includes("kya haal") || q.includes("kaise ho") || q.includes("kasa ahes") || q.includes("good morning") || q.includes("good evening") || q.includes("namaste")) {
    return {
      text: `Hello ${userName}! 👋 I'm **NEST AI**, your 24/7 smart student housing guide for Sanjivani University & Kopargaon.\n\nI can help you find verified PGs, calculate monthly budgets, arrange friend room pairings, compare hostels, or locate stays closest to your department. What would you like to explore today?`,
      recommendations: listings.slice(0, 2),
      followUps: ["🧮 Calculate Monthly Living Cost", "🌸 Find Girls Hostels near Campus", "⚡ Find Boys PGs under ₹4,500", "🎓 Sanjivani Campus & Gate Guide"]
    };
  }

  if (q.includes("thank") || q.includes("shukriya") || q.includes("dhanyawad") || q.includes("great") || q.includes("helpful") || q.includes("nice") || q.includes("mast") || q.includes("badiya")) {
    return {
      text: `You're very welcome, ${userName}! 😊 Happy to assist your college journey. If you need anything else — like comparing room rents, checking curfew rules, or finding stays close to your department — just ask me anytime!`,
      recommendations: listings.slice(0, 2),
      followUps: ["Compare top 3 student stays", "Show budget stays under ₹4,500", "Sanjivani Campus & Gate Guide"]
    };
  }

  // 21. Intelligent Semantic Fallback for All Out-of-the-Box Questions
  return {
    text: `Thanks for asking, ${userName}! Regarding *"${userQuery}"*:\n\nAs your Sanjivani University accommodation assistant, I can help you with anything related to student housing in Kopargaon — including:\n- **Finding Verified PGs & Hostels** (Single, Twin, Triple sharing from **₹${listings[0]?.rent || 3800}/mo**)\n- **Direct Owner Connect & Free Room Visits** (0% Brokerage)\n- **Campus Navigation** (Hostels near Gate 1, Gate 2, Library & College Road)\n- **Flexible Payment & Waitlists** (Zero advance deposit required)\n\nHere are some quick topics you can explore:`,
    recommendations: listings.slice(0, 2),
    followUps: [
      "🧮 Calculate Monthly Living Cost",
      "💰 Find budget stays under ₹4,500/mo",
      "🌸 Girls Hostels near Sanjivani COE",
      "⚡ Boys Hostels with WiFi & Inverter",
      "🏡 How to list a new property on NESTRO?"
    ]
  };
}

function renderFormattedMarkdown(text, isUser) {
  if (!text) return null;
  const lines = text.split("\n");

  const formatInline = (str) => {
    // Match **bold** tokens
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        const boldVal = part.slice(2, -2);
        return (
          <strong key={pIdx} style={{ fontWeight: 700, color: isUser ? "#fff" : "#241016" }}>
            {boldVal}
          </strong>
        );
      }
      return part;
    });
  };

  return lines.map((line, lIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lIdx} style={{ height: 6 }} />;
    }

    // Markdown Headers: ### Header or ## Header
    if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
      const headerText = trimmed.replace(/^#{2,3}\s+/, "");
      return (
        <p
          key={lIdx}
          style={{
            margin: lIdx === 0 ? "0 0 6px" : "10px 0 6px",
            fontFamily: "Fraunces,serif",
            fontSize: 14.5,
            fontWeight: 700,
            color: isUser ? "#fff" : "#241016",
            lineHeight: 1.3
          }}>
          {formatInline(headerText)}
        </p>
      );
    }

    // Markdown Bullets: - item or • item or * item
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || (trimmed.startsWith("* ") && !trimmed.startsWith("**"))) {
      const bulletText = trimmed.replace(/^[-•*]\s+/, "");
      return (
        <div
          key={lIdx}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            margin: "3px 0",
            fontSize: 13,
            lineHeight: 1.5,
            paddingLeft: 4
          }}>
          <span style={{ color: isUser ? "#fff" : "#5B1526", fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>•</span>
          <div style={{ flex: 1 }}>{formatInline(bulletText)}</div>
        </div>
      );
    }

    // Standard text line
    return (
      <p
        key={lIdx}
        style={{
          margin: "3px 0",
          fontSize: 13.5,
          lineHeight: 1.55,
          color: isUser ? "#fff" : "#241016"
        }}>
        {formatInline(trimmed)}
      </p>
    );
  });
}

function NextAIAssistant({ listings, user, onSelectListing }) {
  const [messages, setMessages] = useState(() => {
    try {
      const cached = localStorage.getItem("nestro_next_ai_chat");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [
      {
        id: 1,
        sender: "ai",
        text: `Hey ${user.name ? user.name.split(" ")[0] : "Student"}! 👋 I'm **NEST AI**, your AI campus & accommodation guide for Sanjivani University, Kopargaon.\n\nAsk me anything — like *"Calculate monthly living cost"*, *"Find Girls PG under ₹5,000"*, *"Hostels with Mess included"*, or *"Campus guide for Sanjivani COE"*!`,
        time: "Just now",
        recommendations: listings.slice(0, 2),
        followUps: [
          "🧮 Calculate Monthly Living Cost",
          "🎓 Sanjivani Campus & Gate Guide",
          "🌸 Girls Hostels with 24/7 Warden",
          "⚡ Boys PGs with WiFi & Inverter",
          "⏳ How does the Priority Waitlist work?"
        ]
      }
    ];
  });

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem("nestro_next_ai_chat", JSON.stringify(messages));
    } catch (e) {}
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: text,
      time: "Just now"
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      const res = generateNextAIResponse(text, listings, user);
      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: res.text,
        recommendations: res.recommendations,
        followUps: res.followUps,
        time: "Just now"
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 550);
  };

  const handleClearChat = () => {
    const reset = [
      {
        id: Date.now(),
        sender: "ai",
        text: `Chat cleared! ✨ I'm **Next**, your AI assistant. Ask me to find verified hostels, estimate monthly budgets, or guide you around Sanjivani University!`,
        time: "Just now",
        recommendations: listings.slice(0, 2),
        followUps: [
          "🧮 Calculate Monthly Student Living Cost",
          "🎓 Sanjivani Campus & Gate Guide",
          "🌸 Girls Hostels near Campus",
          "⚡ Boys PGs under ₹4,500/mo"
        ]
      }
    ];
    setMessages(reset);
  };

  const topics = [
    { id: "all", label: "✨ All Topics", prompt: "Hello NEST AI! Help me find verified PGs and Hostels near Sanjivani University." },
    { id: "calc", label: "🧮 Budget Calculator", prompt: "Calculate monthly student living cost in Kopargaon" },
    { id: "campus", label: "🎓 Campus Guide", prompt: "Show Sanjivani University campus and gate guide" },
    { id: "girls", label: "🌸 Girls Hostels", prompt: "Show verified Girls Hostels near Sanjivani COE" },
    { id: "boys", label: "⚡ Boys PGs", prompt: "Show verified Boys Hostels with WiFi and Inverter" },
    { id: "twin", label: "🛏️ 2-Room / Twin PGs", prompt: "Show 2-room and double sharing PGs near campus" },
    { id: "waitlist", label: "⏳ Waitlist System", prompt: "How does the Priority Waitlist queue work?" }
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", background: "#FFFDFB", overflow: "hidden" }}>
      {/* AI Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0DEDD", background: "#FFFDFB", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <img
              src="/nest-ai-logo.png"
              alt="NEST AI"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                objectFit: "cover",
                boxShadow: "0 4px 14px rgba(184,77,136,0.35)",
                border: "1.5px solid #EADCD9"
              }}
            />
            <span style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 19, fontWeight: 700, color: "#241016", margin: 0 }}>
                NEST AI
              </h3>
              <span style={{ background: "#FAF0EE", color: "#5B1526", border: "1px solid #EADCD9", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
                Campus Assistant
              </span>
            </div>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#8C6B70", margin: "2px 0 0" }}>
              Intelligent Hostels, PGs &amp; Sanjivani University Housing Guide
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Clear Chat History"
          style={{ padding: "7px 12px", background: "#FAF6F5", border: "1px solid #EADCD9", borderRadius: 10, color: "#8C6B70", fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <Trash2 size={14} />
          <span>Clear</span>
        </button>
      </div>

      {/* Interactive Topics Pill Bar */}
      <div style={{ display: "flex", gap: 6, padding: "10px 16px", borderBottom: "1px solid #F0DEDD", background: "#FAF6F5", overflowX: "auto", flexShrink: 0, scrollbarWidth: "none" }}>
        {topics.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTopic(t.id);
              handleSend(t.prompt);
            }}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              border: `1.5px solid ${selectedTopic === t.id ? "#5B1526" : "#EADCD9"}`,
              background: selectedTopic === t.id ? "#5B1526" : "#fff",
              color: selectedTopic === t.id ? "#fff" : "#5B1526",
              fontFamily: "Inter,sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.sender === "user" ? "flex-end" : "flex-start", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "88%", flexDirection: m.sender === "user" ? "row-reverse" : "row" }}>
              {m.sender === "ai" && (
                <img
                  src="/nest-ai-logo.png"
                  alt="NEST AI"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    objectFit: "cover",
                    flexShrink: 0,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                    border: "1px solid #EADCD9"
                  }}
                />
              )}
              <div style={{
                background: m.sender === "user" ? "#5B1526" : "#FAF6F5",
                color: m.sender === "user" ? "#fff" : "#241016",
                border: m.sender === "user" ? "none" : "1px solid #EADCD9",
                borderRadius: m.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "13px 17px",
                fontFamily: "Inter,sans-serif",
                fontSize: 13.5,
                lineHeight: 1.55,
                boxShadow: m.sender === "user" ? "0 4px 12px rgba(91,21,38,0.25)" : "0 2px 6px rgba(0,0,0,0.03)"
              }}>
                {renderFormattedMarkdown(m.text, m.sender === "user")}
              </div>
            </div>

            {/* In-chat Recommended Listings */}
            {m.recommendations && m.recommendations.length > 0 && (
              <div style={{ width: "100%", maxWidth: 640, marginTop: 4, display: "flex", flexDirection: "column", gap: 8, paddingLeft: m.sender === "ai" ? 40 : 0 }}>
                <p style={{ margin: 0, fontFamily: "Inter,sans-serif", fontSize: 11.5, fontWeight: 700, color: "#8C6B70", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Recommended Accommodations:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                  {m.recommendations.map(l => (
                    <div
                      key={l.id}
                      onClick={() => onSelectListing(l)}
                      style={{
                        background: "#fff",
                        border: "1.5px solid #EADCD9",
                        borderRadius: 14,
                        padding: 10,
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        cursor: "pointer",
                        transition: "all .15s",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                      }}>
                      <img
                        src={l.photos?.[0] || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"}
                        alt={l.name}
                        style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontFamily: "Fraunces,serif", fontSize: 13.5, fontWeight: 700, color: "#241016", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {l.name}
                        </p>
                        <p style={{ margin: "2px 0 0", fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70" }}>
                          📍 {l.area} · {l.distanceKm} km
                        </p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                          <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, color: "#5B1526" }}>
                            ₹{l.rent}/mo
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", display: "flex", alignItems: "center", gap: 2 }}>
                            View Details →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In-chat Follow-up Suggestions */}
            {m.followUps && m.followUps.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: m.sender === "ai" ? 40 : 0, marginTop: 4 }}>
                {m.followUps.map((f, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => handleSend(f)}
                    style={{
                      background: "#FAF0EE",
                      border: "1px solid #F0DEDD",
                      color: "#5B1526",
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontFamily: "Inter,sans-serif",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                    <span>💬</span> {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="/nest-ai-logo.png"
              alt="NEST AI"
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                objectFit: "cover",
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                border: "1px solid #EADCD9"
              }}
            />
            <div style={{ background: "#FAF6F5", border: "1px solid #EADCD9", borderRadius: "18px 18px 18px 4px", padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5B1526", animation: "pulse 1s infinite" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5B1526", animation: "pulse 1s infinite .2s" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5B1526", animation: "pulse 1s infinite .4s" }} />
              <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", marginLeft: 4 }}>NEST AI is analyzing…</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} style={{ height: 20 }} />
      </div>

      {/* Input Bar */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #F0DEDD", background: "#FFFDFB", flexShrink: 0 }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#FAF6F5", border: "1.5px solid #EADCD9", borderRadius: 999, padding: "6px 8px 6px 16px" }}>
          <Sparkles size={16} color="#702459" />
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Ask Next AI (e.g. Calculate monthly expense, find girls PG under ₹5,000)..."
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: "Inter,sans-serif", fontSize: 13, color: "#241016" }}
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: inputVal.trim() ? "#5B1526" : "#EADCD9",
              color: "#fff",
              border: "none",
              cursor: inputVal.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background .15s",
              flexShrink: 0
            }}>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN APP
══════════════════════════════════════ */
export default function App() {
  const mobile = useIsMobile();
  const { isInstalled, installApp } = usePWAInstall();
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("nestro_current_user");
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [listings, setListings] = useState(() => {
    let base = LISTINGS;
    try {
      const custom = localStorage.getItem("nestro_custom_listings");
      if (custom) {
        const parsed = JSON.parse(custom);
        base = [...parsed, ...LISTINGS];
      }
    } catch (e) {}
    try {
      const cachedSaved = localStorage.getItem("nestro_saved_ids");
      if (cachedSaved) {
        const ids = JSON.parse(cachedSaved);
        return base.map(l => ({ ...l, saved: ids.includes(l.id) }));
      }
    } catch (e) {}
    return base;
  });
  const [screen, setScreen] = useState("home"); // home | detail | booking
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("explore");
  const [searchQ, setSearchQ] = useState("");
  const [area, setArea] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [budgetMax, setBudgetMax] = useState(16000);
  const [typeFilter, setTypeFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showListProperty, setShowListProperty] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [waitlists, setWaitlists] = useState(() => {
    try {
      const cached = localStorage.getItem("nestro_waitlists");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistTargetListing, setWaitlistTargetListing] = useState(null);
  const [waitlistInitialRoom, setWaitlistInitialRoom] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem("nestro_notifications");
      return cached ? JSON.parse(cached) : [
        {
          id: 1,
          type: "waitlist",
          title: "⏳ Priority Waitlist System Active",
          desc: "Join priority queues for high-demand Kopargaon hostels. Instant email & in-app alerts trigger on room vacancy.",
          time: "Just now",
          read: false,
          icon: "⏳"
        },
        {
          id: 2,
          type: "verified",
          title: "🎓 Campus Student Verified",
          desc: "Your Sanjivani University student profile is verified with 0% brokerage direct owner access.",
          time: "2 hours ago",
          read: false,
          icon: "🎓"
        },
        {
          id: 3,
          type: "listing",
          title: "🏡 6 Verified PGs in Kopargaon",
          desc: "Explore verified accommodations on College Road, Shirdi Road, and Station Road.",
          time: "1 day ago",
          read: true,
          icon: "📍"
        }
      ];
    } catch (e) {
      return [];
    }
  });

  function handleMarkAllRead() {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem("nestro_notifications", JSON.stringify(updated));
    } catch (e) {}
  }

  function handleDismissNotification(id) {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    try {
      localStorage.setItem("nestro_notifications", JSON.stringify(updated));
    } catch (e) {}
  }

  function handleJoinWaitlist(listing, roomType, moveInMonth) {
    const assignedRank = waitlists.filter(w => w.listingId === listing.id).length + 1;
    const entry = {
      id: Date.now(),
      listingId: listing.id,
      listingName: listing.name,
      listingArea: listing.area,
      listingAccent: listing.accent,
      listingPhoto: listing.photos?.[0],
      roomType: roomType || "Any Available Room",
      expectedMonth: moveInMonth || "Immediate",
      queueRank: assignedRank,
      joinedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      status: "Active Queue",
      userEmail: user?.email,
      userName: user?.name
    };
    const next = [entry, ...waitlists.filter(w => w.listingId !== listing.id)];
    setWaitlists(next);
    try {
      localStorage.setItem("nestro_waitlists", JSON.stringify(next));
    } catch (e) {}
    try {
      setDoc(doc(db, "waitlists", String(entry.id)), entry).catch(() => {});
    } catch (e) {}

    // Add immediate notification alert
    const notif = {
      id: Date.now() + 1,
      type: "waitlist",
      title: `⏳ Waitlist Active: ${listing.name}`,
      desc: `You are #${assignedRank} in line for ${roomType} at ${listing.name}. An alert will trigger instantly when a bed frees up.`,
      time: "Just now",
      read: false,
      icon: "⏳"
    };
    const nextNotifs = [notif, ...notifications];
    setNotifications(nextNotifs);
    try {
      localStorage.setItem("nestro_notifications", JSON.stringify(nextNotifs));
    } catch (e) {}

    return assignedRank;
  }

  function handleLeaveWaitlist(id) {
    const next = waitlists.filter(w => w.id !== id);
    setWaitlists(next);
    try {
      localStorage.setItem("nestro_waitlists", JSON.stringify(next));
    } catch (e) {}
  }

  function handleAddNewProperty(newProp) {
    const updated = [newProp, ...listings];
    setListings(updated);
    try {
      const customOnly = updated.filter(l => !LISTINGS.some(orig => orig.id === l.id));
      localStorage.setItem("nestro_custom_listings", JSON.stringify(customOnly));
    } catch (e) {}
    try {
      setDoc(doc(db, "listings", String(newProp.id)), newProp).catch(() => {});
    } catch (e) {}

    // Add alert to notifications
    const notif = {
      id: Date.now(),
      type: "listing",
      title: `🏡 Property Published: ${newProp.name}`,
      desc: `Your property in ${newProp.area} is now live and accepting student inquiries and waitlists.`,
      time: "Just now",
      read: false,
      icon: "🏡"
    };
    setNotifications(prev => [notif, ...prev]);
    try {
      localStorage.setItem("nestro_notifications", JSON.stringify([notif, ...notifications]));
    } catch (e) {}

    // Open detail page immediately
    setSelected(newProp);
    setScreen("detail");
  }

  // Firestore Real-Time Listener for All Hostels & PGs
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "listings"), (snapshot) => {
        if (!snapshot.empty) {
          const remoteListings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          let currentSavedIds = [];
          try {
            const cached = localStorage.getItem("nestro_saved_ids");
            if (cached) currentSavedIds = JSON.parse(cached);
          } catch (e) {}

          setListings(prev => {
            const merged = [...remoteListings];
            prev.forEach(p => {
              if (!merged.some(m => String(m.id) === String(p.id))) {
                merged.push(p);
              }
            });
            return merged.map(l => ({
              ...l,
              saved: currentSavedIds.includes(l.id) || l.saved
            }));
          });
        }
      }, (err) => {
        console.log("Firestore Listings Note:", err);
      });
      return () => unsub();
    } catch (e) {}
  }, []);

  // 1. Listen to Auth State and load User Profile from Firestore (Preserves profile across devices & refreshes)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const cleanEmail = fbUser.email.toLowerCase().trim();
        const userDocRef = doc(db, "users", cleanEmail);

        let profileFromDb = null;
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            profileFromDb = snap.data();
          }
        } catch (e) {}

        const finalUserData = {
          name: profileFromDb?.name || fbUser.displayName || cleanEmail.split("@")[0] || "Student",
          email: cleanEmail,
          college: profileFromDb?.college || localStorage.getItem(`nestro_college_${cleanEmail}`) || "Sanjivani University, Kopargaon",
          phone: profileFromDb?.phone || "9834620537",
          moveIn: profileFromDb?.moveIn || "2026-09-01"
        };

        if (!profileFromDb) {
          try {
            await setDoc(userDocRef, { ...finalUserData, createdAt: new Date().toISOString() }, { merge: true });
          } catch (e) {}
        }

        setUser(finalUserData);
        try {
          localStorage.setItem("nestro_current_user", JSON.stringify(finalUserData));
        } catch (e) {}
      } else {
        const cached = localStorage.getItem("nestro_current_user");
        if (!cached) {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-Time Cloud Firestore Sync for Profile & Wishlist across all devices
  useEffect(() => {
    if (!user?.email) return;
    const userKey = user.email.toLowerCase().trim();
    try {
      // Profile listener (reflects edits made from another device instantly)
      const unsubUser = onSnapshot(doc(db, "users", userKey), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUser(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              name: data.name || prev.name,
              college: data.college || prev.college,
              phone: data.phone || prev.phone,
              moveIn: data.moveIn || prev.moveIn
            };
          });
          if (Array.isArray(data.savedListingIds)) {
            const cloudSavedIds = data.savedListingIds;
            setListings(prev => prev.map(l => ({
              ...l,
              saved: cloudSavedIds.some(sid => String(sid) === String(l.id))
            })));
          }
        }
      }, () => {});

      // Wishlist listener (user_saved)
      const unsubSaved = onSnapshot(doc(db, "user_saved", userKey), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const cloudSavedIds = Array.isArray(data.savedIds) ? data.savedIds : [];
          try {
            localStorage.setItem("nestro_saved_ids", JSON.stringify(cloudSavedIds));
            localStorage.setItem(`nestro_saved_ids_${userKey}`, JSON.stringify(cloudSavedIds));
          } catch (e) {}
          setListings(prev => prev.map(l => ({
            ...l,
            saved: cloudSavedIds.some(sid => String(sid) === String(l.id))
          })));
          if (selected) {
            setSelected(s => s ? ({ ...s, saved: cloudSavedIds.some(sid => String(sid) === String(s.id)) }) : s);
          }
        }
      }, () => {});

      return () => {
        unsubUser();
        unsubSaved();
      };
    } catch (e) {}
  }, [user?.email]);

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (e) {}
    try {
      localStorage.removeItem("nestro_current_user");
    } catch (e) {}
    setUser(null);
  }

  function handleAuthDone(u) {
    setUser(u);
    try {
      localStorage.setItem("nestro_current_user", JSON.stringify(u));
    } catch (e) {}
  }

  function toggleSave(id) {
    setListings(p => {
      const next = p.map(l => l.id === id ? { ...l, saved: !l.saved } : l);
      const savedIds = next.filter(l => l.saved).map(l => l.id);
      
      // 1. Save to localStorage (instant offline speed)
      try {
        localStorage.setItem("nestro_saved_ids", JSON.stringify(savedIds));
        if (user?.email) {
          localStorage.setItem(`nestro_saved_ids_${user.email.toLowerCase().trim()}`, JSON.stringify(savedIds));
        }
      } catch (e) {}

      // 2. Sync to Cloud Firestore (cross-device sync for same user account)
      if (user?.email) {
        try {
          const userKey = user.email.toLowerCase().trim();
          setDoc(doc(db, "user_saved", userKey), {
            email: user.email,
            savedIds: savedIds,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        } catch (e) {}
      }

      return next;
    });
    if (selected?.id === id) setSelected(s => ({ ...s, saved: !s.saved }));
  }

  const filtered = useMemo(() => {
    let r = listings.filter(l => {
      const q = searchQ.toLowerCase();
      if (q && !l.name.toLowerCase().includes(q) && !l.area.toLowerCase().includes(q)) return false;
      if (area !== "All" && l.area !== area) return false;
      if (typeFilter !== "All" && l.type !== typeFilter) return false;
      if (genderFilter !== "All" && l.gender !== genderFilter && l.gender !== "Any") return false;
      if (l.rent > budgetMax) return false;
      if (verifiedOnly && !l.verified) return false;
      return true;
    });
    if (sortBy === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sortBy === "rent_asc") r = [...r].sort((a, b) => a.rent - b.rent);
    if (sortBy === "rent_desc") r = [...r].sort((a, b) => b.rent - a.rent);
    if (sortBy === "distance") r = [...r].sort((a, b) => a.distanceKm - b.distanceKm);
    return r;
  }, [listings, searchQ, area, typeFilter, genderFilter, budgetMax, verifiedOnly, sortBy]);

  const saved = listings.filter(l => l.saved);

  if (authLoading && !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAF6F5", fontFamily: "Inter,sans-serif" }}>
        <img src="/logo.png" alt="NESTRO" style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", marginBottom: 14, boxShadow: "0 8px 24px rgba(91,21,38,0.2)" }} />
        <p style={{ fontFamily: "Fraunces,serif", fontSize: 22, fontWeight: 700, color: "#241016", margin: "0 0 4px" }}>NESTRO</p>
        <p style={{ fontSize: 12.5, color: "#8C6B70", margin: 0 }}>Restoring student session…</p>
      </div>
    );
  }

  if (!user) return <AuthFlow onDone={handleAuthDone} />;
  if (screen === "booking") return <BookingFlow listing={selected} user={user} onBack={() => setScreen("detail")} onConfirm={() => { setScreen("home"); setSelected(null); setActiveTab("explore"); }} />;
  if (screen === "detail" && selected) {
    return (
      <>
        <DetailPage
          listing={selected}
          onBack={() => setScreen("home")}
          onSave={toggleSave}
          onBook={() => setScreen("booking")}
          onJoinWaitlist={(l, rt) => {
            setWaitlistTargetListing(l || selected);
            setWaitlistInitialRoom(rt || "");
            setShowWaitlistModal(true);
          }}
        />
        {showWaitlistModal && waitlistTargetListing && (
          <WaitlistModal
            listing={waitlistTargetListing}
            initialRoomType={waitlistInitialRoom}
            user={user}
            onJoin={handleJoinWaitlist}
            onClose={() => {
              setShowWaitlistModal(false);
              setWaitlistTargetListing(null);
            }}
          />
        )}
      </>
    );
  }

  /* ── Home Screen ── */
  const navItems = [
    { id: "explore", Icon: Home, label: "Explore" },
    { id: "ai", isImage: true, iconSrc: "/nest-ai-logo.png", label: "NEST AI", badge: "AI" },
    { id: "saved", Icon: Bookmark, label: "Saved", badge: saved.length },
    { id: "profile", Icon: User, label: "Profile" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#FFFDFB" }}>
      {/* Desktop sidebar */}
      {!mobile && (
        <div style={{ width: 230, background: "#FFFDFB", borderRight: "1px solid #F0DEDD", display: "flex", flexDirection: "column", padding: "18px 12px", flexShrink: 0 }}>
          <div style={{ padding: "0 8px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="NESTRO" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
            <div>
              <p style={{ fontFamily: "Fraunces,serif", fontSize: 18, fontWeight: 700, color: "#2E0A16", margin: 0 }}>NESTRO</p>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70", margin: 0 }}>Find. Compare. Move In.</p>
            </div>
          </div>
          {navItems.map(({ id, Icon, isImage, iconSrc, label, badge }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12, border: "none", cursor: "pointer", marginBottom: 4, background: activeTab === id ? "#5B1526" : "transparent", color: activeTab === id ? "#fff" : "#8C6B70", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, width: "100%", textAlign: "left" }}>
              {isImage ? (
                <img src={iconSrc} alt={label} style={{ width: 20, height: 20, borderRadius: 6, objectFit: "cover", border: activeTab === id ? "1.5px solid rgba(255,255,255,0.6)" : "1px solid #EADCD9" }} />
              ) : (
                <Icon size={17} />
              )}
              {label}
              {badge && badge !== 0 && <span style={{ marginLeft: "auto", background: activeTab === id ? "rgba(255,255,255,0.3)" : "#5B1526", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999 }}>{badge}</span>}
            </button>
          ))}

          {/* Host / Owner Registration Card */}
          <div style={{ marginTop: "auto", padding: "14px 12px", background: "#FAF6F5", border: "1px dashed #EADCD9", borderRadius: 16, textAlign: "center" }}>
            <p style={{ margin: "0 0 2px", fontFamily: "Fraunces,serif", fontSize: 13.5, fontWeight: 700, color: "#241016" }}>Own a PG or Hostel?</p>
            <p style={{ margin: "0 0 10px", fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70", lineHeight: 1.35 }}>List for free &amp; get direct student inquiries</p>
            <button
              onClick={() => setShowListProperty(true)}
              style={{ width: "100%", padding: "8px 0", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: "0 2px 8px rgba(91,21,38,0.2)" }}>
              + List Property 🏡
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Explore Tab */}
        {activeTab === "explore" && (
          <>
            {/* Header */}
            <div style={{ background: "#FFFDFB", borderBottom: "1px solid #F0DEDD", padding: mobile ? "14px 16px 10px" : "16px 20px 12px" }}>
              {mobile && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src="/logo.png" alt="NESTRO" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }} />
                    <div>
                      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "#8C6B70", margin: 0 }}>Good evening, {user.name.split(" ")[0]} 👋</p>
                      <p style={{ fontFamily: "Fraunces,serif", fontSize: 17, fontWeight: 700, color: "#241016", margin: 0 }}>Find your PG</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => setShowListProperty(true)}
                      style={{ background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>
                      + List PG
                    </button>
                    <button
                      onClick={() => setShowNotifications(true)}
                      style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bell size={20} color="#5B1526" />
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span style={{ position: "absolute", top: 0, right: 0, background: "#DC2626", color: "#fff", fontSize: 9, fontWeight: 700, width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {!mobile && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p style={{ fontFamily: "Fraunces,serif", fontSize: 22, fontWeight: 700, color: "#241016", margin: 0 }}>
                    Explore PGs &amp; Hostels near {user.college?.split(",")[0] || "your college"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => setShowListProperty(true)}
                      style={{ background: "#5B1526", color: "#fff", border: "none", borderRadius: 12, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter,sans-serif", fontSize: 12.5, fontWeight: 700, boxShadow: "0 2px 8px rgba(91,21,38,0.2)" }}>
                      + List PG / Hostel 🏡
                    </button>
                    <button
                      onClick={() => setShowNotifications(true)}
                      style={{ position: "relative", background: "#FAF6F5", border: "1.5px solid #EADCD9", borderRadius: 12, padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "background .15s" }}>
                      <Bell size={15} color="#5B1526" />
                      <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600, color: "#5B1526" }}>Alerts</span>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span style={{ background: "#DC2626", color: "#fff", fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 999 }}>
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {/* Search */}
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#F6EDEC", borderRadius: 12, padding: "10px 14px", border: "1px solid #EADCD9" }}>
                  <Search size={15} color="#8C6B70" />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search PGs, hostels, areas..." style={{ border: "none", background: "none", outline: "none", flex: 1, fontFamily: "Inter,sans-serif", fontSize: 13, color: "#241016" }} />
                  {searchQ && <button onClick={() => setSearchQ("")} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={13} color="#8C6B70" /></button>}
                </div>
                <button onClick={() => setShowFilters(true)} style={{ position: "relative", padding: "10px 14px", background: "#fff", border: "1.5px solid #EADCD9", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Filter size={15} color="#5B1526" />
                  {!mobile && <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600, color: "#5B1526" }}>Filters</span>}
                </button>
              </div>
              {/* Area chips */}
              <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", scrollbarWidth: "none" }}>
                {AREAS.map(a => (
                  <button key={a} onClick={() => setArea(a)} style={{ padding: "5px 12px", borderRadius: 999, border: "1.5px solid", whiteSpace: "nowrap", borderColor: area === a ? "#5B1526" : "#EADCD9", background: area === a ? "#5B1526" : "#fff", color: area === a ? "#fff" : "#8C6B70", fontFamily: "Inter,sans-serif", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort + count */}
            <div style={{ padding: "8px 16px", background: "#FFFDFB", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F6EDEC" }}>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12.5, color: "#8C6B70" }}>
                <span style={{ fontWeight: 700, color: "#241016" }}>{filtered.length}</span> listings
              </p>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#241016", fontWeight: 600, border: "1px solid #EADCD9", borderRadius: 8, padding: "4px 8px", background: "#fff", cursor: "pointer", outline: "none" }}>
                <option value="rating">⭐ Top Rated</option>
                <option value="rent_asc">💰 Price: Low to High</option>
                <option value="rent_desc">💰 Price: High to Low</option>
                <option value="distance">📍 Nearest First</option>
              </select>
            </div>

            {/* Listings */}
            <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "12px" : "16px 20px" }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px", maxWidth: 440, margin: "40px auto", background: "#FFFDFB", borderRadius: 24, border: "1px solid #EADCD9", boxShadow: "0 12px 35px -15px rgba(91,21,38,0.15)" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FAF0EE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Building2 size={28} color="#5B1526" />
                  </div>
                  <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 700, color: "#241016", margin: "0 0 8px" }}>No PGs Listed Yet</h3>
                  <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#8C6B70", lineHeight: 1.5, margin: "0 0 20px" }}>
                    All demo listings have been cleared. Verified student accommodations are currently being vetted and onboarded to NESTRO.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      onClick={() => alert("Host / PG Partner Inquiries: Email partners@nestro.in or call 1800-NESTRO-SAFE (Toll Free) to verify and list your property.")}
                      style={{ padding: "12px 24px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "opacity .15s" }}>
                      + List a Property / Host PG
                    </button>
                    {(searchQ || area !== "All" || typeFilter !== "All" || genderFilter !== "All" || verifiedOnly) && (
                      <button
                        onClick={() => { setArea("All"); setTypeFilter("All"); setGenderFilter("All"); setBudgetMax(16000); setVerifiedOnly(false); setSearchQ(""); }}
                        style={{ padding: "10px 20px", background: "transparent", color: "#5B1526", border: "1px solid #EADCD9", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: mobile ? 10 : 18 }}>
                  {filtered.map(l => <ListingCard key={l.id} l={l} onOpen={l => { setSelected(l); setScreen("detail"); }} onSave={toggleSave} />)}
                </div>
              )}
              {/* Floating Ask NEST AI button on Explore */}
              <button
                onClick={() => setActiveTab("ai")}
                style={{
                  position: "fixed",
                  bottom: mobile ? 74 : 26,
                  right: mobile ? 16 : 28,
                  background: "linear-gradient(135deg, #1A050C 0%, #4A0E1C 50%, #70162B 100%)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 999,
                  padding: "7px 16px 7px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "Inter,sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 8px 24px -4px rgba(74,14,28,0.55)",
                  zIndex: 40,
                  transition: "transform .15s"
                }}>
                <img
                  src="/nest-ai-logo.png"
                  alt="NEST AI"
                  style={{ width: 26, height: 26, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,0.3)" }}
                />
                <span>Ask NEST AI ✨</span>
              </button>

              <div style={{ height: mobile ? 80 : 24 }} />
            </div>
          </>
        )}

        {/* Campus Bazaar (Marketplace) Tab */}
        {activeTab === "bazaar" && (
          <CampusBazaar
            user={user}
            onOpenItem={() => {}}
          />
        )}

        {/* Next AI Tab */}
        {activeTab === "ai" && (
          <NextAIAssistant
            listings={listings}
            user={user}
            onSelectListing={(l) => {
              setSelected(l);
              setScreen("detail");
            }}
          />
        )}

        {/* Saved Tab */}
        {activeTab === "saved" && (
          <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "16px" : "24px" }}>
            <p style={{ fontFamily: "Fraunces,serif", fontSize: 22, fontWeight: 700, color: "#241016", marginBottom: 4 }}>Saved</p>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#8C6B70", marginBottom: 18 }}>{saved.length} listing{saved.length !== 1 ? "s" : ""} saved</p>
            {saved.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <Heart size={48} color="#D4B896" style={{ margin: "0 auto 14px" }} />
                <p style={{ fontFamily: "Fraunces,serif", fontSize: 18, fontWeight: 600, color: "#241016", marginBottom: 8 }}>No saved listings yet</p>
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#8C6B70", marginBottom: 16 }}>Saved properties will appear here</p>
                <button onClick={() => setActiveTab("explore")} style={{ padding: "10px 20px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Browse Explore</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
                {saved.map(l => <ListingCard key={l.id} l={l} onOpen={l => { setSelected(l); setScreen("detail"); }} onSave={toggleSave} />)}
              </div>
            )}
            <div style={{ height: 80 }} />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "16px" : "28px 36px", background: "#FAF6F5" }}>
            <div style={{ maxWidth: 920, margin: "0 auto" }}>
              
              {/* Hero Banner Card */}
              <div style={{
                position: "relative",
                background: "linear-gradient(135deg, #4A0E1C 0%, #6E1A30 55%, #8C243E 100%)",
                borderRadius: 24,
                padding: mobile ? "24px 20px" : "32px 36px",
                color: "#fff",
                boxShadow: "0 18px 45px -15px rgba(74,14,28,0.45)",
                overflow: "hidden",
                marginBottom: 20
              }}>
                {/* Decorative background circle */}
                <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
                
                <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", alignItems: mobile ? "center" : "flex-start", justifyContent: "space-between", gap: 20, position: "relative", zIndex: 1, textAlign: mobile ? "center" : "left" }}>
                  
                  {/* Left: Avatar & Info */}
                  <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", alignItems: mobile ? "center" : "center", gap: 20 }}>
                    {/* Avatar */}
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #EADCD9 0%, #FFFFFF 100%)", color: "#5B1526", border: "4px solid #C9A24B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, fontFamily: "Fraunces,serif", boxShadow: "0 8px 24px rgba(0,0,0,0.25)", flexShrink: 0 }}>
                      {user.name ? user.name.charAt(0).toUpperCase() : "S"}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: mobile ? "center" : "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <h2 style={{ fontFamily: "Fraunces,serif", fontSize: mobile ? 22 : 26, fontWeight: 700, margin: 0, color: "#fff" }}>{user.name || "Student User"}</h2>
                        <span style={{ background: "rgba(201,162,75,0.25)", border: "1px solid #C9A24B", color: "#FFE8A3", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, display: "flex", alignItems: "center", gap: 4 }}>
                          🎓 Registered Student Member
                        </span>
                      </div>

                      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13.5, color: "#F0DEDD", margin: 0, opacity: 0.9 }}>
                        {user.college || "Sanjivani University, Kopargaon"} · {user.email || ""}
                      </p>
                    </div>
                  </div>

                  {/* Right: Edit Profile Button */}
                  <button
                    onClick={() => setShowEditProfile(true)}
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      backdropFilter: "blur(6px)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "#fff",
                      padding: "10px 20px",
                      borderRadius: 999,
                      fontFamily: "Inter,sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      alignSelf: mobile ? "center" : "flex-start",
                      transition: "all .15s"
                    }}>
                    ✏️ Edit Profile
                  </button>

                </div>
              </div>

              {/* Real Account Quick Stats Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 20
              }}>
                {[
                  { label: "Campus University", val: user.college ? user.college.split(",")[0] : "Sanjivani", sub: "Kopargaon Campus", icon: "🎓", color: "#5B1526" },
                  { label: "Saved Listings", val: `${saved.length}`, sub: "In Wishlist", icon: "🔖", color: "#C9A24B" },
                  { label: "Waitlist Queues", val: `${waitlists.length}`, sub: waitlists.length > 0 ? "Priority Active" : "No Queues", icon: "⏳", color: "#9333EA" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#fff", border: "1px solid #F0DEDD", borderRadius: 16, padding: "16px 18px", boxShadow: "0 4px 16px -8px rgba(46,10,22,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: "Inter,sans-serif", fontWeight: 700, color: "#8C6B70", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</span>
                      <span style={{ fontSize: 14 }}>{stat.icon}</span>
                    </div>
                    <p style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: "#241016", margin: "0 0 2px" }}>{stat.val}</p>
                    <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: stat.color, fontWeight: 600, margin: 0 }}>{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* 2-Column Responsive Dashboard */}
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.2fr 1fr", gap: 18 }}>
                
                {/* LEFT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  
                  {/* My Active Priority Waitlist Queues */}
                  <div style={{ background: "#fff", border: "1px solid #F0DEDD", borderRadius: 20, padding: 22, boxShadow: "0 4px 20px -10px rgba(46,10,22,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 17, fontWeight: 700, color: "#241016", margin: 0 }}>My Waitlist Queues</h3>
                        <span style={{ background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
                          {waitlists.length} Active
                        </span>
                      </div>
                    </div>

                    {waitlists.length === 0 ? (
                      <div style={{ background: "#FAF6F5", border: "1px dashed #EADCD9", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
                        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "#241016", margin: "0 0 4px" }}>
                          No Active Waitlists
                        </p>
                        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: "0 0 10px", lineHeight: 1.4 }}>
                          If a full or high-demand hostel runs out of beds, join its queue to get instant vacancy notifications.
                        </p>
                        <button onClick={() => setActiveTab("explore")} style={{ padding: "7px 18px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          Explore Hostels 🔍
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {waitlists.map(w => (
                          <div key={w.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", background: "#FAF6F5", border: "1px solid #EADCD9", borderRadius: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <img src={w.listingPhoto || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"} alt={w.listingName} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                                <div>
                                  <p style={{ margin: 0, fontFamily: "Fraunces,serif", fontSize: 14, fontWeight: 700, color: "#241016" }}>{w.listingName}</p>
                                  <p style={{ margin: "2px 0 0", fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70" }}>{w.roomType} · {w.expectedMonth}</p>
                                </div>
                              </div>
                              <span style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", color: "#15803D", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
                                Rank #{w.queueRank} in Line 🎯
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 6, borderTop: "1px dashed #EADCD9" }}>
                              <span style={{ fontSize: 11, color: "#166534", fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                                🔔 Alert enabled for {user?.email}
                              </span>
                              <button
                                onClick={() => handleLeaveWaitlist(w.id)}
                                style={{ background: "none", border: "none", color: "#DC2626", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: "2px 6px" }}>
                                Leave Queue
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* My Housing Activity & Wishlist */}
                  <div style={{ background: "#fff", border: "1px solid #F0DEDD", borderRadius: 20, padding: 22, boxShadow: "0 4px 20px -10px rgba(46,10,22,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 17, fontWeight: 700, color: "#241016", margin: 0 }}>My Housing Activity</h3>
                      <button onClick={() => setActiveTab("saved")} style={{ background: "none", border: "none", color: "#5B1526", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                        View Wishlist ({saved.length}) →
                      </button>
                    </div>

                    <div style={{ background: "#FAF6F5", border: "1px dashed #EADCD9", borderRadius: 14, padding: "20px 16px", textAlign: "center" }}>
                      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13.5, fontWeight: 600, color: "#241016", margin: "0 0 4px" }}>
                        {saved.length === 0 ? "No Saved Properties Yet" : `${saved.length} Property Saved`}
                      </p>
                      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#8C6B70", margin: "0 0 14px", lineHeight: 1.4 }}>
                        Browse student properties and hostels around {user.college?.split(",")[0] || "your campus"}.
                      </p>
                      <button onClick={() => setActiveTab("explore")} style={{ padding: "8px 22px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                        Browse Explore 🔍
                      </button>
                    </div>
                  </div>

                  {/* List Property Owner Banner */}
                  <div style={{ background: "linear-gradient(135deg, #FAF0EE 0%, #FFFDFB 100%)", border: "1.5px dashed #E8B2BC", borderRadius: 20, padding: "18px 20px", display: "flex", flexDirection: mobile ? "column" : "row", alignItems: mobile ? "flex-start" : "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <h4 style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 700, color: "#5B1526", margin: "0 0 3px" }}>
                        🏡 Own a PG, Hostel, or Student Flat?
                      </h4>
                      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#6E4C52", margin: 0, lineHeight: 1.4 }}>
                        Register your property on NESTRO to reach verified Sanjivani students directly at 0% brokerage.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowListProperty(true)}
                      style={{ padding: "9px 20px", background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 2px 8px rgba(91,21,38,0.2)" }}>
                      + List Property
                    </button>
                  </div>

                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  
                  {/* Legal & App Policies Menu */}
                  <div style={{ background: "#fff", border: "1px solid #F0DEDD", borderRadius: 20, padding: 20, boxShadow: "0 4px 20px -10px rgba(46,10,22,0.08)" }}>
                    <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 17, fontWeight: 700, color: "#241016", margin: "0 0 12px" }}>Policies &amp; Support</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "💼 How NESTRO Works & Revenue Model", sub: "100% transparent partner & monetization breakdown", action: () => setLegalModalTab("revenue") },
                        { label: "📜 Terms of Service", sub: "Rules, eligibility & student conduct", action: () => setLegalModalTab("terms") },
                        { label: "🔒 Privacy Policy", sub: "Zero-spam data protection policy", action: () => setLegalModalTab("privacy") },
                        { label: "🛡️ Escrow & Refund Policy", sub: "24-hr money-back booking guarantee", action: () => setLegalModalTab("escrow") },
                        { label: "🔔 Notifications & Updates", sub: `${notifications.filter(n => !n.read).length} unread updates · View alerts`, action: () => setShowNotifications(true) },
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#FAF6F5", border: "1px solid #F0DEDD", borderRadius: 12, cursor: "pointer", transition: "background .15s" }}>
                          <div style={{ textAlign: "left" }}>
                            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12.5, fontWeight: 600, color: "#241016", margin: 0 }}>{item.label}</p>
                            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70", margin: "2px 0 0" }}>{item.sub}</p>
                          </div>
                          <ChevronRight size={15} color="#8C6B70" />
                        </button>
                      ))}
                    </div>

                    {/* 24/7 Student Helpline Box */}
                    <div style={{ marginTop: 14, padding: "14px 16px", background: "#FBEEEC", borderRadius: 14, border: "1px solid #EADCD9", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12.5, fontWeight: 700, color: "#5B1526", margin: "0 0 2px" }}>📞 24/7 Student Support Helpline</p>
                        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13.5, fontWeight: 700, color: "#241016", margin: "2px 0 0" }}>+91 98346 20537</p>
                        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "#8C6B70", margin: "2px 0 0" }}>✉️ nestrosupport@gmail.com</p>
                      </div>
                      
                      <div style={{ display: "flex", gap: 8 }}>
                        <a
                          href="tel:9834620537"
                          style={{
                            flex: 1,
                            padding: "8px 0",
                            background: "#5B1526",
                            color: "#fff",
                            textDecoration: "none",
                            borderRadius: 999,
                            fontFamily: "Inter,sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            boxShadow: "0 2px 8px rgba(91,21,38,0.2)"
                          }}>
                          <Phone size={13} />
                          <span>Call Support</span>
                        </a>

                        <a
                          href="https://wa.me/919834620537?text=Hi%20NESTRO%20Support,%20I%20need%20help%20with%20hostel%20booking%20at%20Sanjivani%20University"
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1,
                            padding: "8px 0",
                            background: "#25D366",
                            color: "#fff",
                            textDecoration: "none",
                            borderRadius: 999,
                            fontFamily: "Inter,sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5
                          }}>
                          <MessageCircle size={13} fill="#fff" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href="mailto:nestrosupport@gmail.com?subject=NESTRO%20Student%20Support%20Inquiry"
                          style={{
                            padding: "8px 12px",
                            background: "#fff",
                            color: "#5B1526",
                            border: "1px solid #EADCD9",
                            textDecoration: "none",
                            borderRadius: 999,
                            fontFamily: "Inter,sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                          ✉️
                        </a>
                      </div>
                    </div>

                    {/* Sign out */}
                    <button
                      onClick={handleSignOut}
                      style={{ width: "100%", marginTop: 14, padding: "11px 0", background: "transparent", color: "#DC2626", border: "1.5px solid #FCA5A5", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .15s" }}>
                      Sign Out of Account
                    </button>
                  </div>

                </div>

              </div>

              <div style={{ height: 60 }} />
            </div>
          </div>
        )}

        {/* Mobile Bottom Nav */}
        {mobile && (
          <div style={{ background: "#FFFDFB", borderTop: "1px solid #F0DEDD", display: "flex", paddingBottom: "env(safe-area-inset-bottom,4px)", flexShrink: 0 }}>
            {navItems.map(({ id, Icon, isImage, iconSrc, label, badge }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px", border: "none", background: "none", cursor: "pointer", color: activeTab === id ? "#5B1526" : "#8C6B70", position: "relative" }}>
                {isImage ? (
                  <img src={iconSrc} alt={label} style={{ width: 22, height: 22, borderRadius: 6, objectFit: "cover", border: activeTab === id ? "1.5px solid #5B1526" : "1px solid #EADCD9" }} />
                ) : (
                  <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
                )}
                <span style={{ fontSize: 10, fontWeight: activeTab === id ? 700 : 500, fontFamily: "Inter,sans-serif" }}>{label}</span>
                {badge && badge !== 0 && <span style={{ position: "absolute", top: 6, left: "55%", background: "#E84393", color: "#fff", fontSize: 9, fontWeight: 700, width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div onClick={() => setShowFilters(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#FFFDFB", borderRadius: "20px 20px 0 0", padding: "20px 20px 36px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, background: "#E0D0CE", borderRadius: 999, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 18, fontWeight: 600, color: "#241016" }}>Filters</h3>
              <button onClick={() => { setTypeFilter("All"); setGenderFilter("All"); setBudgetMax(16000); setVerifiedOnly(false); }} style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#5B1526", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Reset all</button>
            </div>
            {[["Type", ["All", "PG", "Hostel", "Flat", "Co-living"], typeFilter, setTypeFilter], ["For", ["All", "Women", "Men"], genderFilter, setGenderFilter]].map(([label, opts, val, set]) => (
              <div key={label} style={{ marginBottom: 18 }}>
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 700, color: "#8C6B70", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {opts.map(o => <button key={o} onClick={() => set(o)} style={{ padding: "6px 14px", borderRadius: 999, border: `1.5px solid ${val === o ? "#5B1526" : "#EADCD9"}`, background: val === o ? "#5B1526" : "#fff", color: val === o ? "#fff" : "#241016", fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{o}</button>)}
                </div>
              </div>
            ))}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 700, color: "#8C6B70", textTransform: "uppercase", letterSpacing: "0.06em" }}>Max Budget</p>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: "#5B1526" }}>₹{budgetMax.toLocaleString("en-IN")}</span>
              </div>
              <input type="range" min={4000} max={16000} step={500} value={budgetMax} onChange={e => setBudgetMax(Number(e.target.value))} style={{ width: "100%", accentColor: "#5B1526" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 20 }}>
              <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} style={{ accentColor: "#5B1526", width: 16, height: 16 }} />
              <span style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "#241016" }}>✓ Verified listings only</span>
            </label>
            <button onClick={() => setShowFilters(false)} style={{ width: "100%", padding: 13, background: "#5B1526", color: "#fff", border: "none", borderRadius: 999, fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Show {filtered.length} Results</button>
          </div>
        </div>
      )}

      {/* Global Legal Modal in App */}
      {legalModalTab && <LegalModal initialTab={legalModalTab} onClose={() => setLegalModalTab(null)} />}

      {/* Edit Profile Modal with Full Cloud Sync */}
      {showEditProfile && (
        <EditProfileModal
          user={user}
          onSave={async (updated) => {
            const next = { ...user, ...updated };
            setUser(next);
            try {
              localStorage.setItem("nestro_current_user", JSON.stringify(next));
              if (next.email && next.college) {
                localStorage.setItem(`nestro_college_${next.email.toLowerCase().trim()}`, next.college);
              }
            } catch (e) {}

            // Sync to Firestore database
            if (next.email) {
              try {
                const userKey = next.email.toLowerCase().trim();
                await setDoc(doc(db, "users", userKey), {
                  name: next.name || "",
                  email: next.email || "",
                  college: next.college || "Sanjivani University, Kopargaon",
                  phone: next.phone || "",
                  moveIn: next.moveIn || "",
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              } catch (e) {
                console.log("Firestore profile sync error:", e);
              }
            }

            // Update Firebase Auth displayName
            if (auth.currentUser && updated.name) {
              try {
                await updateProfile(auth.currentUser, { displayName: updated.name });
              } catch (e) {}
            }
          }}
          onClose={() => setShowEditProfile(false)}
        />
      )}

      {/* Global Priority Waitlist Modal */}
      {showWaitlistModal && waitlistTargetListing && (
        <WaitlistModal
          listing={waitlistTargetListing}
          initialRoomType={waitlistInitialRoom}
          user={user}
          onJoin={handleJoinWaitlist}
          onClose={() => {
            setShowWaitlistModal(false);
            setWaitlistTargetListing(null);
          }}
        />
      )}

      {/* Global Notifications Center Modal */}
      {showNotifications && (
        <NotificationsModal
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onDismiss={handleDismissNotification}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Global List PG / Hostel Modal */}
      {showListProperty && (
        <ListPropertyModal
          onSubmit={handleAddNewProperty}
          onClose={() => setShowListProperty(false)}
        />
      )}

      {/* Global Tenancy Agreement & Rent Receipt Modal */}
      {showAgreementModal && (
        <DigitalAgreementModal
          user={user}
          listing={listings[0]}
          onClose={() => setShowAgreementModal(false)}
        />
      )}
    </div>
  );
}
