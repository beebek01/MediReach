import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import StatCard from "../../components/ui/StatCard";
import Footer from "../../components/layout/Footer";
import api from "../../services/api";
import logo from "../../assets/images/logo2.png";
import heroVideo from "../../assets/videos/hero-video.mp4";

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to recenter map when location changes
function LocationMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here (Approximate)</Popup>
    </Marker>
  );
}

const features = [
  {
    icon: "💊",
    title: "Wide Medicine Range",
    desc: "From OTC to prescription medicines, all in one place.",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    icon: "📄",
    title: "Prescription Upload",
    desc: "Upload your prescription and get it verified by our pharmacists.",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    icon: "🚚",
    title: "Fast Delivery",
    desc: "Quick delivery across Nepal — Kathmandu to your district.",
    gradient: "from-orange-400 to-red-500",
  },
  {
    icon: "🔒",
    title: "Secure & Verified",
    desc: "Only genuine medicines from licensed pharmacies.",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: "💳",
    title: "Flexible Payment",
    desc: "Pay via COD or IME Pay — your choice.",
    gradient: "from-indigo-400 to-purple-500",
  },
  {
    icon: "📞",
    title: "24/7 Support",
    desc: "MediBot and support team here to help 24/7.",
    gradient: "from-green-400 to-emerald-500",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Regular Customer",
    content:
      "MediReach saved me countless trips to the pharmacy. Their delivery is always on time!",
    avatar: "SJ",
  },
  {
    name: "Dr. Rajesh Sharma",
    role: "Pharmacist",
    content:
      "As a healthcare professional, I trust MediReach for authentic medicines and reliable service.",
    avatar: "RS",
  },
  {
    name: "Maya Thapa",
    role: "Busy Parent",
    content:
      "With young kids, I don't have time for pharmacy queues. MediReach delivers right to my door.",
    avatar: "MT",
  },
];

const defaultStats = [
  { value: "0", label: "Orders Delivered" },
  { value: "0", label: "Medicines" },
  { value: "0", label: "Partner Pharmacies" },
  { value: "0", label: "Districts Covered" },
];

export default function LandingPage() {
  const [stats, setStats] = useState(defaultStats);
  const [userLocation, setUserLocation] = useState([27.7172, 85.324]); // Default to Kathmandu

  useEffect(() => {
    api
      .getPublicStats()
      .then((res) => {
        if (res.data?.stats) setStats(res.data.stats);
      })
      .catch(() => {});

    // Request user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        () => {
          // Keep default location if denied/failed
        },
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cream via-white to-emerald-50 relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute -bottom-40 right-1/4 w-72 h-72 bg-gradient-to-br from-purple-200/25 to-pink-200/25 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-4 py-6 lg:px-10 backdrop-blur-md bg-white/80 border-b border-emerald-100/50">
        <Link to="/" className="flex items-center shrink-0 group">
          <img
            src={logo}
            alt="MediReach Logo"
            className="h-16 md:h-20 w-auto bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300"
          />
        </Link>
        <div className="flex items-center">
          <Link
            to="/medicines"
            className="text-base font-medium text-charcoal/80 hover:text-primary transition-colors relative group"
          >
            Medicines
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>
          <div className="h-5 w-[1px] bg-charcoal/20 hidden sm:block mx-6"></div>
          <Link
            to="/login"
            className="text-base font-medium text-charcoal/80 hover:text-primary transition-colors relative group"
          >
            Sign In
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link
            to="/register"
            className="ml-8 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary px-6 py-2.5 text-base font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Video with Overlay */}
        <div className="absolute inset-0 z-0">
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-teal-800/30 to-cyan-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-transparent"></div>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 px-4 py-20 w-full max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200/50 mb-8 animate-fade-up shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-emerald-800">
              Delivering across Nepal 24/7
            </span>
          </div>

          <h1
            className="font-fraunces text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-charcoal leading-tight mb-6 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Your health
            </span>
            ,
            <br className="hidden sm:block" />
            <span className="text-charcoal">delivered instantly</span>
          </h1>

          <p
            className="mt-6 text-lg sm:text-xl md:text-2xl text-charcoal/70 max-w-3xl mx-auto font-light leading-relaxed animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            Nepal's premier digital pharmacy. Authentic medicines, instant
            prescription validation, and lightning-fast delivery to your
            doorstep.
          </p>

          {/* Enhanced Search Bar */}
          <div
            className="mt-12 w-full max-w-2xl mx-auto animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = "/medicines";
              }}
              className="relative flex items-center w-full h-16 sm:h-20 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl p-2 border border-white/50 hover:shadow-3xl transition-all duration-300 focus-within:ring-4 focus-within:ring-primary/20"
            >
              <div className="flex items-center justify-center w-12 sm:w-16 h-full text-charcoal/40">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for medicines, health products..."
                className="flex-1 h-full bg-transparent border-none outline-none text-lg sm:text-xl text-charcoal placeholder-charcoal/40 font-medium"
              />
              <button
                type="submit"
                className="h-full px-6 sm:px-10 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Search
              </button>
            </form>
          </div>

          {/* Trust Badges */}
          <div
            className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-charcoal/60 animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-emerald-100/50">
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="text-sm font-medium">100% Genuine</span>
            </div>
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-emerald-100/50">
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="text-sm font-medium">Verified Doctors</span>
            </div>
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-emerald-100/50">
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-white to-teal-50"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {stats.map((s, i) => (
            <div
              key={i}
              className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center border border-emerald-100/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:bg-white"
            >
              <p className="font-fraunces text-4xl lg:text-5xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                {s.value}
              </p>
              <p className="text-charcoal/60 text-sm font-medium tracking-wide uppercase">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              MediReach
            </span>
            ?
          </h2>
          <p className="text-lg text-charcoal/60">
            Experience healthcare delivery reimagined for the modern age.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-emerald-50 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              ></div>

              <div className="relative z-10">
                <span
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${f.gradient} text-3xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}
                >
                  {f.icon}
                </span>
                <h3 className="font-fraunces text-xl font-bold text-charcoal mb-3 group-hover:text-primary transition-colors duration-300">
                  {f.title}
                </h3>
                <p className="text-charcoal/60 leading-relaxed text-sm">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 lg:px-8 bg-gradient-to-r from-emerald-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-charcoal mb-4">
              What Our{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Customers
              </span>{" "}
              Say
            </h2>
            <p className="text-lg text-charcoal/60">
              Join thousands of satisfied customers across Nepal
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-emerald-100/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg mr-4">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal">{t.name}</h4>
                    <p className="text-sm text-charcoal/60">{t.role}</p>
                  </div>
                </div>
                <p className="text-charcoal/70 italic">"{t.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-fraunces text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to prioritize your health?
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers across Nepal. Setup takes less
            than a minute.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <Link
              to="/register"
              className="rounded-2xl bg-white px-8 py-4 font-semibold text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Create an Account
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 font-semibold text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:-translate-y-1"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 lg:px-8 bg-white relative z-10 border-t border-charcoal/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-fraunces text-3xl md:text-4xl font-bold text-charcoal mb-4">
              We deliver to your{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                exact location
              </span>
            </h2>
            <p className="text-charcoal/60">
              Pinpoint accuracy ensures your sensitive medical deliveries reach
              you safely.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-charcoal/10 h-[500px] md:h-[600px] relative z-0">
            <MapContainer
              center={userLocation}
              zoom={16}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%", zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={userLocation} />
            </MapContainer>
          </div>
        </div>
      </section>

      <Footer variant="light" />
    </div>
  );
}
