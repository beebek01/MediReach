import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import StatCard from '../../components/ui/StatCard';
import Footer from "../../components/layout/Footer";
import api from '../../services/api';
import logo from '../../assets/images/logo.png';
import heroVideo from '../../assets/videos/hero-video.mp4';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
  },
  {
    icon: "📄",
    title: "Prescription Upload",
    desc: "Upload your prescription and get it verified by our pharmacists.",
  },
  {
    icon: "🚚",
    title: "Fast Delivery",
    desc: "Quick delivery across Nepal — Kathmandu to your district.",
  },
  {
    icon: "🔒",
    title: "Secure & Verified",
    desc: "Only genuine medicines from licensed pharmacies.",
  },
  {
    icon: "💳",
    title: "Flexible Payment",
    desc: "Pay via COD or IME Pay — your choice.",
  },
  {
    icon: "📞",
    title: "Support",
    desc: "MediBot and support team here to help 24/7.",
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
  const [userLocation, setUserLocation] = useState([27.7172, 85.3240]); // Default to Kathmandu

  useEffect(() => {
    api.getPublicStats()
      .then((res) => {
        if (res.data?.stats) setStats(res.data.stats);
      })
      .catch(() => {});

    // Request user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Keep default location if denied/failed
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cream relative">
      {/* Navbar omitted, using CustomerNavbar in full app flow but keeping this for standalone */}
      <nav className="absolute top-0 w-full z-40 flex items-center justify-between px-4 py-6 lg:px-10">
        <Link to="/" className="flex items-center shrink-0">
          <img src={logo} alt="MediReach Logo" className="h-16 md:h-20 w-auto bg-white p-2 rounded-2xl shadow-md" />
        </Link>
        <div className="flex items-center">
          <Link to="/medicines" className="text-base font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm hover-underline-animation">
            Medicines
          </Link>
          <div className="h-5 w-[1px] bg-white/30 hidden sm:block mx-6"></div>
          <Link to="/login" className="text-base font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm hover-underline-animation">
            Sign In
          </Link>
          <Link to="/register" className="ml-8 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 px-6 py-2.5 text-base font-medium text-white hover:bg-white/20 transition-all shadow-lg hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 bg-charcoal">
          <video 
            src={heroVideo} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-70 z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 px-4 py-20 w-full max-w-5xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-fade-up">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-sm font-medium text-cream">Delivering across Nepal 24/7</span>
          </div>
          
          <h1 className="font-fraunces text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight drop-shadow-2xl animate-fade-up reveal-delay-100">
            <span className="italic font-light text-gradient bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-200">Your health</span>,
            <br className="hidden sm:block" /> delivered to your door.
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl md:text-2xl text-cream/90 max-w-2xl mx-auto drop-shadow-md animate-fade-up reveal-delay-200 font-light">
            Nepal's premier digital pharmacy. Authentic medicines, instant prescription validation, and lightning-fast delivery.
          </p>

          {/* Search Bar / Main CTA */}
          <div className="mt-10 w-full max-w-2xl mx-auto animate-fade-up reveal-delay-300">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = "/medicines";
              }}
              className="relative flex items-center w-full h-16 sm:h-20 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-2 transition-transform hover:shadow-[0_8px_40px_rgba(0,0,0,0.2)] focus-within:ring-4 focus-within:ring-primary/30"
            >
              <div className="flex items-center justify-center w-12 sm:w-16 h-full text-charcoal/40">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search for medicines, health products..." 
                className="flex-1 h-full bg-transparent border-none outline-none text-lg sm:text-xl text-charcoal placeholder-charcoal/40 font-medium"
              />
              <button 
                type="submit"
                className="h-full px-6 sm:px-10 bg-primary hover:bg-primary-dark text-white rounded-xl sm:rounded-full font-semibold text-lg transition-colors shadow-md"
              >
                Search
              </button>
            </form>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-cream/80 animate-fade-up reveal-delay-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span className="text-sm font-medium">100% Genuine</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span className="text-sm font-medium">Verified Doctors</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-charcoal to-charcoal-light py-20 px-4 lg:px-8 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {stats.map((s, i) => (
            <div key={i} className="glass-dark rounded-3xl p-8 text-center border-t border-white/10 hover:-translate-y-2 transition-transform duration-500">
              <p className="font-fraunces text-4xl lg:text-5xl font-bold text-white mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
                {s.value}
              </p>
              <p className="text-emerald-200/80 text-sm font-medium tracking-wide uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Why Choose MediReach?
          </h2>
          <p className="text-lg text-charcoal/60">
            Experience healthcare delivery reimagined for the modern age.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-3xl border border-charcoal/5 bg-white p-8 shadow-card hover-lift relative overflow-hidden"
            >
              {/* Subtle hover gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-3xl mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                  {f.icon}
                </span>
                <h3 className="font-fraunces text-xl font-bold text-charcoal mb-3">
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

      <section className="py-24 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-cream to-secondary/10" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-charcoal mb-6">
            Ready to prioritize your health?
          </h2>
          <p className="text-lg text-charcoal/70 mb-10">
            Join thousands of satisfied customers across Nepal. Setup takes less than a minute.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <Link
              to="/register"
              className="rounded-2xl bg-charcoal px-8 py-4 font-medium text-white hover:bg-charcoal-light shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              Create an Account
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border-2 border-charcoal/10 bg-white px-8 py-4 font-medium text-charcoal hover:border-charcoal/30 hover:-translate-y-1 transition-all duration-300"
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
              We deliver to your exact location
            </h2>
            <p className="text-charcoal/60">
              Pinpoint accuracy ensures your sensitive medical deliveries reach you safely.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-card border border-charcoal/10 h-[500px] md:h-[600px] relative z-0">
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

      <Footer variant="dark" />
    </div>
  );
}
