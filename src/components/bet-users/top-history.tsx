import React, { useEffect } from "react";
import MoonLoader from "react-spinners/MoonLoader";
import "./bets.scss";

const fakeTopData = [
  { betAmount: 5000, cashoutAt: 12.45, cashouted: true },
  { betAmount: 1000, cashoutAt: 8.23, cashouted: true },
  { betAmount: 2000, cashoutAt: 6.78, cashouted: true },
  { betAmount: 500, cashoutAt: 15.34, cashouted: true },
  { betAmount: 3000, cashoutAt: 4.56, cashouted: true },
  { betAmount: 800, cashoutAt: 22.11, cashouted: true },
  { betAmount: 1500, cashoutAt: 7.89, cashouted: true },
  { betAmount: 200, cashoutAt: 18.67, cashouted: true },
  { betAmount: 4000, cashoutAt: 3.21, cashouted: true },
  { betAmount: 750, cashoutAt: 9.45, cashouted: true },
];

const TopHistory = () => {
  const [type, setType] = React.useState(0);
  const [history, setHistory] = React.useState<any[]>([]);
  const [loadingEffect, setLoadingEffect] = React.useState(false);

  const loadData = () => {
    setLoadingEffect(true);
    setTimeout(() => {
      setHistory(fakeTopData);
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
              loadData();
            }}
            className={`tab`}
          >
            Day
          </button>
          <button
            onClick={() => {
              setType(1);
              loadData();
            }}
            className={`tab`}
          >
            Month
          </button>
          <button
            onClick={() => {
              setType(2);
              loadData();
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
              {history.map((item: any, index: number) => (
                <div key={index} className="bet-item">
                  <div className="main">
                    <div className="icon">
                      <img
                        className="avatar"
                        alt="avatar"
                        src="/avatars/av-5.png"
                      ></img>
                      <div className="username">d***3</div>
                    </div>
                    <div className="score">
                      <div className="flex">
                        <div className="">
                          <span>Bet, INR:&nbsp;</span>
                          <span></span>
                        </div>
                        <span className="amount">
                          {item.betAmount.toFixed(2)}
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
                          <span>Win, INR: &nbsp;</span>
                        </div>
                        <span className="amount">
                          {(item.cashoutAt * item.betAmount).toFixed(2)}
                        </span>
                      </div>
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
