"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FeatureGrid } from "./FeatureGrid";

const words = ["লাইভ পরীক্ষা", "প্রাকটিস পরীক্ষা", "ফলাফল এনালাইসিস"];

export function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleTyping = () => {
      const currentWord = words[wordIndex];
      if (isDeleting) {
        if (charIndex > 0) {
          setText(currentWord.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
          setTypingSpeed(75);
        } else {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
          setTypingSpeed(500);
        }
      } else {
        if (charIndex < currentWord.length) {
          setText(currentWord.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
          setTypingSpeed(150);
        } else {
          setIsDeleting(true);
          setTypingSpeed(2000);
        }
      }
    };

    const timeoutId = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timeoutId);
  }, [charIndex, isDeleting, wordIndex, typingSpeed, isClient]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-center">
        <div className="text-center lg:text-left animate-in fade-in slide-in-from-left duration-700">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold md:leading-tight">
            সেরা প্রস্তুতির, সেরা পথ
          </h1>
          <div className="mt-4 animate-in fade-in slide-in-from-left duration-700 delay-200">
            <div className="flex items-center justify-center lg:justify-start min-h-10 md:min-h-12">
              <h2 className="text-base sm:text-lg text-muted-foreground">
                {isClient && (
                  <>
                    <span className="typing-animation">{text}</span>
                    <span className="animate-blink-caret border-r-2 border-primary"></span>
                  </>
                )}
              </h2>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground">
              সবকিছুর জন্যে সেরা প্লাটফর্ম{" "}
              <b className="text-primary">"MNR Study"</b>
            </p>
          </div>
          <div className="animate-in fade-in slide-in-from-left duration-700 delay-400">
            <FeatureGrid />
          </div>
        </div>

        <div className="flex justify-center items-center relative max-w-sm sm:max-w-md w-full h-auto mx-auto aspect-square animate-in fade-in zoom-in duration-700 delay-300">
          <Image
            alt="Exam preparation"
            layout="fill"
            objectFit="contain"
            className="w-full h-full"
            src="https://raw.githubusercontent.com/MNRfrom2020/logo-and-icon-cdn/refs/heads/main/Image/Exam.png"
            priority
          />
        </div>
      </div>
    </div>
  );
}
