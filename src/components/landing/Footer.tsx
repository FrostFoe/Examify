import {
  Globe,
  Mail,
  Send,
  Facebook,
  Youtube,
  Twitter,
  Instagram,
  Github,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";

const socialLinks = [
  { label: "Website", href: "https://mnr.world", icon: Globe },
  { label: "Mail", href: "mailto:mail@mnr.world", icon: Mail },
  { label: "Telegram", href: "https://t.me/MNRfrom2020", icon: Send },
  {
    label: "Facebook",
    href: "https://facebook.com/MNRfrom2020",
    icon: Facebook,
  },
  { label: "Youtube", href: "https://youtube.com/@MNRfrom2020", icon: Youtube },
  { label: "Twitter", href: "https://x.com/MNRfrom2020", icon: Twitter },
  {
    label: "Instagram",
    href: "https://instagram.com/MNRfrom2020",
    icon: Instagram,
  },
  { label: "Github", href: "https://github.com/MNRfrom2020", icon: Github },
];

export function Footer() {
  return (
    <footer className="w-full">
      <div className="bg-card/50 rounded-t-2xl shadow-lg px-4 sm:px-8 py-8 border-x border-t border-border">
        <div className="grid grid-cols-1">
          <div className="col-span-1">
            <Link
              href="https://mnr.world"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 mb-4 w-fit"
            >
              <Logo className="h-8 w-auto" />
              <span className="text-2xl font-bold">
                MNR <span className="text-primary">Study</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm">
              আপনার চূড়ান্ত পরীক্ষার প্রস্তুতি সঙ্গী...
            </p>
            <div className="flex items-center flex-wrap gap-3 mt-6">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-transform hover:scale-115"
                  aria-label={label}
                  href={href}
                >
                  <Icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
