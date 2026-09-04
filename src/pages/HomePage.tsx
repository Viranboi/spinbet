import React, { useState } from "react";
import {
  Radio, Receipt,
  Menu as MenuIcon, Search, User,
} from "lucide-react";
import Header from "../components/qwin/Header";
import SubNavbar from "../components/qwin/SubNavbar";
import SportsSidebar from "../components/qwin/SportsSidebar";
import HeroBanner from "../components/qwin/HeroBanner";
import FavoriteLeagues from "../components/qwin/FavoriteLeagues";
import FeaturedGames from "../components/qwin/FeaturedGames";
import MatchFeed from "../components/qwin/MatchFeed";
import Betslip from "../components/qwin/Betslip";
import { SIDE_BANNER } from "../components/qwin/data";
import type { Selection } from "../components/qwin/data";
import "./HomePage.scss";

export default function HomePage() {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  function togglePick(sel: Omit<Selection, "key">) {
    setSelections((prev) => {
      if (prev.some((s) => s.key === sel.pickLabel)) {
        return prev.filter((s) => s.key !== sel.pickLabel);
      }
      return [...prev, { ...sel, key: sel.pickLabel }];
    });
  }

  function removeSel(key: string) {
    setSelections((prev) => prev.filter((s) => s.key !== key));
  }

  function clearAll() {
    setSelections([]);
  }

  return (
    <div className="wn-app">
      <Header onMenu={() => setDrawerOpen(true)} />
       <SubNavbar onMenu={() => setDrawerOpen(true)} />

      <main className="wn-main">
        <div className="wn-grid">
          <aside className="wn-col-left">
            <SportsSidebar />
          </aside>

          <div className="wn-col-center">
            <HeroBanner />
            <FavoriteLeagues />
            <FeaturedGames selections={selections} onToggle={togglePick} />
            <MatchFeed selections={selections} onToggle={togglePick} />
          </div>

          <aside className="wn-col-right">
            <Betslip selections={selections} onRemove={removeSel} onClear={clearAll} />
            <div className="wn-side-banner">
              <img src={SIDE_BANNER} alt="Contact us" loading="lazy" />
            </div>
          </aside>
        </div>
      </main>

      <footer className="wn-footer">
        <div className="wn-footer-in">
          <div className="wn-f-block">
            <div className="title">Contact Us</div>
            <ul>
              <li><a href="#!"><Mail size={16} /><span>Email</span></a></li>
              <li><a href="#!"><PhoneCall size={16} /><span>Call Us</span></a></li>
              <li><a href="#!"><MessageCircle size={16} /><span>Chat</span></a></li>
              <li><a href="#!"><Send size={16} /><span>Telegram</span></a></li>
            </ul>
          </div>

          <div className="wn-f-block">
            <div className="title">Social</div>
            <ul>
              <li><a href="#!" aria-label="Facebook"><Facebook size={16} /></a></li>
              <li><a href="#!" aria-label="Instagram"><Instagram size={16} /></a></li>
              <li><a href="#!" aria-label="Twitter"><Twitter size={16} /></a></li>
              <li><a href="#!" aria-label="Telegram"><Send size={16} /></a></li>
            </ul>
          </div>

          <div className="wn-f-block">
            <ul className="wn-f-drop">
              <li><button type="button"><span>Support Information</span><ChevronDown size={13} /></button></li>
              <li><button type="button"><span>Essentials</span><ChevronDown size={13} /></button></li>
            </ul>
            <ul className="wn-f-help">
              <li><a href="#!">How to Deposit</a></li>
              <li><a href="#!">How to Withdraw</a></li>
              <li><a href="#!">Help Center</a></li>
            </ul>
          </div>

          <div className="wn-f-block lang">
            <a className="android" href="#!">
              <b>Get the App</b>
              <span>Android</span>
            </a>
            <button type="button" className="wn-f-lang">
              🇬🇧 English <ChevronDown size={12} />
            </button>
          </div>
        </div>
        <div className="wn-footer-base">
          <span className="wn-f-brand">WINNER © {new Date().getFullYear()}</span>
          <span>18+ Gambling can be addictive, play responsibly. Regulated by NLGC of RDB.</span>
        </div>
      </footer>

      {drawerOpen && (
        <>
          <div className="qw-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="qw-drawer">
            <div className="qw-drawer-head">
              <span>All Sports</span>
              <button onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <SportsSidebar />
          </aside>
        </>
      )}

      {sheetOpen && (
        <>
          <div className="qw-overlay" onClick={() => setSheetOpen(false)} />
          <div className="qw-sheet">
            <div className="qw-sheet-head">
              <span>Betslip</span>
              <button onClick={() => setSheetOpen(false)}>✕</button>
            </div>
            <Betslip selections={selections} onRemove={removeSel} onClear={clearAll} />
          </div>
        </>
      )}

      <nav className="qw-tabbar">
        <button className="qw-tab" type="button" onClick={() => setDrawerOpen(true)}><MenuIcon size={20} /><span>Menu</span></button>
        <button className="qw-tab" type="button"><Search size={20} /><span>Search</span></button>
        <button className="qw-tab slip" onClick={() => setSheetOpen(true)}>
          <Receipt size={20} />
          <span>BetSlip</span>
          {selections.length > 0 && <i className="qw-badge">{selections.length}</i>}
        </button>
        <button className="qw-tab" type="button"><Radio size={20} /><span>Live</span></button>
        <button className="qw-tab" type="button"><User size={20} /><span>My Bets</span></button>
      </nav>
    </div>
  );
}
