import React from "react";
import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <footer className="flex md:flex-row flex-col-reverse items-center justify-between text-left w-full px-8 border-t border-gray-500/20 py-4">
      <div className="flex items-center gap-4">
        <img className="hidden md:block w-20" src={assets.logo} alt="Learnova logo" />
        <div className="hidden md:block h-7 w-px bg-gray-500/20"></div>
        <p className="py-4 text-center text-xs md:text-sm text-gray-500">
          Copyright 2026 © Learnova. All Right Reserved.
        </p>
      </div>
      <div className="flex items-center gap-3 max-md:mt-4">
        <a href="#" className="hover:opacity-80 transition">
          <img src={assets.facebook_icon} alt="facebook_icon" className="w-6 h-6" />
        </a>
        <a href="#" className="hover:opacity-80 transition">
          <img src={assets.twitter_icon} alt="twitter_icon" className="w-6 h-6" />
        </a>
        <a href="#" className="hover:opacity-80 transition">
          <img src={assets.instagram_icon} alt="instagram_icon" className="w-6 h-6" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
