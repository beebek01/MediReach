import { Link } from "react-router-dom";
import logo from '../../assets/images/logo.png';

const footerLinks = {
  company: [
    { label: "About Us", to: "#" },
    { label: "Careers", to: "#" },
    { label: "Partner Pharmacies", to: "#" },
  ],
  support: [
    { label: "Contact", to: "#" },
    { label: "FAQs", to: "#" },
    { label: "Delivery Info", to: "#" },
  ],
  legal: [
    { label: "Privacy Policy", to: "#" },
    { label: "Terms of Use", to: "#" },
  ],
};

export default function Footer({ variant = "light" }) {
  const isDark = variant === "dark";

  return (
    <footer
      className={`mt-auto w-full z-20 relative border-t ${
        isDark
          ? "bg-charcoal text-cream border-t border-primary/20 shadow-none"
          : "bg-cream border-charcoal/10 text-charcoal"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-10 lg:py-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="inline-block mb-3 transition-transform hover:scale-105">
              <img src={logo} alt="MediReach Logo" className="h-16 sm:h-20 w-auto bg-white p-2 rounded-2xl shadow-sm" />
            </Link>
            <p
              className={`mt-2 text-sm ${isDark ? "text-cream/70" : "text-charcoal/60"}`}
            >
              Nepal's trusted online pharmacy. Medicines delivered to your door.
            </p>
          </div>
          <div>
            <h4
              className={`font-fraunces font-semibold ${isDark ? "text-cream" : "text-charcoal"}`}
            >
              Company
            </h4>
            <ul className="mt-3 space-y-2">
              {footerLinks.company.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.to}
                    className={`text-sm hover:text-primary transition-colors ${isDark ? "text-cream/70" : "text-charcoal/60"}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4
              className={`font-fraunces font-semibold ${isDark ? "text-cream" : "text-charcoal"}`}
            >
              Support
            </h4>
            <ul className="mt-3 space-y-2">
              {footerLinks.support.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.to}
                    className={`text-sm hover:text-primary transition-colors ${isDark ? "text-cream/70" : "text-charcoal/60"}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4
              className={`font-fraunces font-semibold ${isDark ? "text-cream" : "text-charcoal"}`}
            >
              Contact
            </h4>
            <ul
              className={`mt-3 space-y-1 text-sm ${isDark ? "text-cream/70" : "text-charcoal/60"}`}
            >
              <li>medisupport@gmail.com</li>
              <li>9764887532</li>
              <li>Itahari, Nepal</li>
            </ul>
          </div>
        </div>
        <div
          className={`mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t ${isDark ? "border-white/10" : "border-charcoal/10"}`}
        >
          <p
            className={`text-sm ${isDark ? "text-cream/60" : "text-charcoal/50"}`}
          >
            © {new Date().getFullYear()} MediReach. All rights reserved.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((item) => (
              <a
                key={item.label}
                href={item.to}
                className={`text-sm hover:text-primary transition-colors ${isDark ? "text-cream/60" : "text-charcoal/50"}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
