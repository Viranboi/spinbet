import React, { useEffect } from "react";
import MoonLoader from "react-spinners/MoonLoader";
import "./bets.scss";
import { useCurrency } from "../../currency";

const fakeTopData = [
  { name: "Kamal M.", betAmount: 90000, cashoutAt: 4.12 },
  { name: "Jean D.", betAmount: 88500, cashoutAt: 3.4 },
  { name: "David K.", betAmount: 82000, cashoutAt: 6.5 },
  { name: "Musa J.", betAmount: 79000, cashoutAt: 2.31 },
  { name: "Samuel B.", betAmount: 75000, cashoutAt: 3.9 },
  { name: "Eric R.", betAmount: 72000, cashoutAt: 5.12 },
  { name: "Patrick L.", betAmount: 69000, cashoutAt: 2.45 },
  { name: "Ali N.", betAmount: 67000, cashoutAt: 2.31 },
  { name: "Benjamin T.", betAmount: 65000, cashoutAt: 3.87 },
  { name: "Joseph G.", betAmount: 63000, cashoutAt: 2.56 },
  { name: "Emmanuel A.", betAmount: 61000, cashoutAt: 4.11 },
  { name: "Daniel S.", betAmount: 60001, cashoutAt: 2.68 },
];

interface TopHistoryProps {
  openFairModal?: (round: any) => void;
}

const TopHistory = ({ openFairModal }: TopHistoryProps) => {
  const { num, symbol } = useCurrency();
  // roundHistory available for provably fair data
  const [type, setType] = React.useState(0);
  const [topData, setTopData] = React.useState<any[]>([]);
  const [loadingEffect, setLoadingEffect] = React.useState(false);

  const loadData = (variant = 0) => {
    setLoadingEffect(true);
    setTimeout(() => {
      const rotated = [
        ...fakeTopData.slice(variant % fakeTopData.length),
        ...fakeTopData.slice(0, variant % fakeTopData.length),
      ];
      setTopData(rotated);
      setLoadingEffect(false);
    }, 500);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <div className="navigation-switcher-wrapper">
        <div className="navigation-switcher">
          <div
            className="slider"
            style={{ transform: `translate(${100 * type}px)` }}
          ></div>
          <button
            onClick={() => {
              setType(0);
              loadData(0);
            }}
            className={`tab`}
          >
            Day
          </button>
          <button
            onClick={() => {
              setType(1);
              loadData(4);
            }}
            className={`tab`}
          >
            Month
          </button>
          <button
            onClick={() => {
              setType(2);
              loadData(8);
            }}
            className={`tab`}
          >
            Year
          </button>
        </div>
      </div>
      <div className="top-list-wrapper">
        <div className="top-items-list scroll-y h-100">
          {loadingEffect ? (
            <div className="flex items-center justify-center top-14">
              <MoonLoader color="red" size={35} data-testid="loader" />
            </div>
          ) : (
            <>
              {topData.map((item: any, index: number) => (
                <div key={index} className="bet-item">
                  <div className="main">
                    <div className="icon">
                      <img
                        className="avatar"
                        alt="avatar"
                        src="/avatars/av-5.png"
                      ></img>
                      <div className="username">{item.name}</div>
                    </div>
                    <div className="score">
                      <div className="flex">
                        <div className="">
                            <span>Bet {symbol}:&nbsp;</span>
                          <span></span>
                        </div>
                        <span className="amount">
                           {num(item.betAmount)}
                        </span>
                      </div>
                      <div className="flex">
                        <div className="">
                          <span>Cashed out:&nbsp;</span>
                        </div>
                        <span className="amount cashout">
                          {item.cashoutAt.toFixed(2)}x
                        </span>
                      </div>
                      <div className="flex">
                        <div className="">
                            <span>Win {symbol}: &nbsp;</span>
                        </div>
                        <span className="amount">
                           {num(item.cashoutAt * item.betAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="tools">
                      <div
                        className="fairness-i"
                        style={{ cursor: "pointer", opacity: 0.6 }}
                        title="Verify fairness"
                        onClick={() => openFairModal?.({
                          roundId: `R${Date.now() - index * 60000}-${index}`,
                          crashPoint: item.cashoutAt,
                          serverSeed: "Hidden until round ends",
                          clientSeed: "player_seed_" + index,
                          nonce: index,
                          hash: "SHA256(hidden)",
                          timestamp: Date.now() - index * 60000,
                        })}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TopHistory;
