/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { UnityContext } from "react-unity-webgl";
import { toast } from "react-toastify";
import { generateFakePlayers, generateWatcherCount, FLIGHT_MS } from "./gameEngine";
import { fetchRoundState } from "./upcomingOdds";
import {
  ensureWallet,
  getBalance,
  setBalance as persistSetBalance,
  credit as walletCredit,
  debit as walletDebit,
  subscribeBalance,
} from "./p2p/wallet";
import { isBlocked } from "./p2p/restrictions";

function getCurrentUid(): string | null {
  try {
    const saved = localStorage.getItem("letsbet_current_user");
    if (!saved) return null;
    const u = JSON.parse(saved);
    return u?.uid || null;
  } catch {
    return null;
  }
}

export interface ResponsibleGamingState {
  sessionMinutes: number;
  lossLimit: number;
  depositLimit: number;
  sessionLimit: number;
  coolOffUntil: number | null;
  selfExcluded: boolean;
}

const defaultResponsibleGaming: ResponsibleGamingState = {
  sessionMinutes: 0,
  lossLimit: 0,
  depositLimit: 0,
  sessionLimit: 0,
  coolOffUntil: null,
  selfExcluded: false,
};

function initialBalance(): number {
  try {
    const saved = localStorage.getItem("letsbet_current_user");
    if (!saved) return 0;
    const user = JSON.parse(saved);
    return user?.uid ? ensureWallet(user.uid) : 0;
  } catch {
    return 0;
  }
}

export interface BettedUserType {
  name: string;
  betAmount: number;
  cashOut: number;
  cashouted: boolean;
  target: number;
  img: string;
  bot?: boolean;
  roundId?: string;
}

export interface ProvablyFairRound {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  crashPoint: number;
  hash: string;
  timestamp: number;
  roundId: string;
}

export interface UserType {
  balance: number;
  userType: boolean;
  img: string;
  userName: string;
  f: {
    auto: boolean;
    betted: boolean;
    cashouted: boolean;
    betAmount: number;
    cashAmount: number;
    target: number;
  };
  s: {
    auto: boolean;
    betted: boolean;
    cashouted: boolean;
    betAmount: number;
    cashAmount: number;
    target: number;
  };
}

export interface PlayerType {
  auto: boolean;
  betted: boolean;
  cashouted: boolean;
  betAmount: number;
  cashAmount: number;
  target: number;
}

interface GameStatusType {
  currentNum: number;
  currentSecondNum: number;
  GameState: string;
  time: number;
  speed: number;
}

interface GameBetLimit {
  maxBet: number;
  minBet: number;
}

declare interface GameHistory {
  _id: number;
  name: string;
  betAmount: number;
  cashoutAt: number;
  cashouted: boolean;
  date: number;
}

interface UserStatusType {
  fbetState: boolean;
  fbetted: boolean;
  sbetState: boolean;
  sbetted: boolean;
}

interface ContextDataType {
  myBets: GameHistory[];
  width: number;
  userInfo: UserType;
  fautoCashoutState: boolean;
  fautoCound: number;
  finState: boolean;
  fdeState: boolean;
  fsingle: boolean;
  fincrease: number;
  fdecrease: number;
  fsingleAmount: number;
  fdefaultBetAmount: number;
  sautoCashoutState: boolean;
  sautoCound: number;
  sincrease: number;
  sdecrease: number;
  ssingleAmount: number;
  sinState: boolean;
  sdeState: boolean;
  ssingle: boolean;
  sdefaultBetAmount: number;
  myUnityContext: UnityContext;
}

interface ContextType extends GameBetLimit, UserStatusType, GameStatusType {
  state: ContextDataType;
  unityState: boolean;
  unityLoading: boolean;
  currentProgress: number;
  bettedUsers: BettedUserType[];
  previousHand: BettedUserType[];
  history: number[];
  rechargeState: boolean;
  myUnityContext: UnityContext;
  currentTarget: number;
  watcherCount: number;
  totalBets: number;
  totalCashout: number;
  currentRoundId: string;
  isDemoMode: boolean;
  responsibleGaming: ResponsibleGamingState;
  roundHistory: ProvablyFairRound[];
  setCurrentTarget(attrs: Partial<number>);
  update(attrs: Partial<ContextDataType>);
  getMyBets();
  updateUserBetState(attrs: Partial<UserStatusType>);
  setDemoMode(val: boolean);
  updateResponsibleGaming(attrs: Partial<ResponsibleGamingState>);
}

const unityContext = new UnityContext({
  loaderUrl: "unity/AirCrash.loader.js",
  dataUrl: "unity/AirCrash.data.unityweb",
  frameworkUrl: "unity/AirCrash.framework.js.unityweb",
  codeUrl: "unity/AirCrash.wasm.unityweb",
});

const init_state: ContextDataType = {
  myBets: [],
  width: 1500,
  userInfo: {
    balance: initialBalance(),
    userType: false,
    img: "",
    userName: "Player",
    f: {
      auto: false,
      betted: false,
      cashouted: false,
      cashAmount: 0,
      betAmount: 500,
      target: 2,
    },
    s: {
      auto: false,
      betted: false,
      cashouted: false,
      cashAmount: 0,
      betAmount: 500,
      target: 2,
    },
  },
  fautoCashoutState: false,
  fautoCound: 0,
  finState: false,
  fdeState: false,
  fsingle: false,
  fincrease: 0,
  fdecrease: 0,
  fsingleAmount: 0,
  fdefaultBetAmount: 20,
  sautoCashoutState: false,
  sautoCound: 0,
  sincrease: 0,
  sdecrease: 0,
  ssingleAmount: 0,
  sinState: false,
  sdeState: false,
  ssingle: false,
  sdefaultBetAmount: 20,
  myUnityContext: unityContext,
};

const Context = React.createContext<ContextType>(null!);

let cashOutHandler: ((at: number, index: "f" | "s") => void) | null = null;

export const callCashOut = (at: number, index: "f" | "s") => {
  cashOutHandler?.(at, index);
};

let fDecreaseAmount = 0;
let sDecreaseAmount = 0;

export const Provider = ({ children }: any) => {
  const [state, setState] = React.useState<ContextDataType>({ ...init_state });
  const [gameState, setGameState] = React.useState<GameStatusType>({
    currentNum: 0,
    currentSecondNum: 0,
    GameState: "",
    time: 0,
    speed: 1,
  });

  const [unity, setUnity] = React.useState({
    unityState: false,
    unityLoading: false,
    currentProgress: 0,
  });

  const [bettedUsers, setBettedUsers] = React.useState<BettedUserType[]>([]);
  const [previousHand, setPreviousHand] = React.useState<BettedUserType[]>([]);
  const [history, setHistory] = React.useState<number[]>([]);
  const [userBetState, setUserBetState] = React.useState<UserStatusType>({
    fbetState: false,
    fbetted: false,
    sbetState: false,
    sbetted: false,
  });
  const [rechargeState] = React.useState(false);
  const [currentTarget, setCurrentTarget] = React.useState(0);
  const [betLimit] = React.useState<GameBetLimit>({ maxBet: 90000, minBet: 10 });
  const [watcherCount, setWatcherCount] = React.useState(0);
  const [totalBets, setTotalBets] = React.useState(0);
  const [totalCashout, setTotalCashout] = React.useState(0);
  const [currentRoundId, setCurrentRoundId] = React.useState("");
  const [isDemoMode, setIsDemoMode] = React.useState(false);
  const [responsibleGaming, setResponsibleGaming] = React.useState<ResponsibleGamingState>(() => {
    try {
      const saved = localStorage.getItem("aviator_responsible_gaming");
      return saved ? { ...defaultResponsibleGaming, ...JSON.parse(saved) } : defaultResponsibleGaming;
    } catch { return defaultResponsibleGaming; }
  });
  const [roundHistory, setRoundHistory] = React.useState<ProvablyFairRound[]>([]);

  const stateRef = React.useRef(state);
  const betStateRef = React.useRef(userBetState);
  const gameActiveRef = React.useRef(true);
  const sessionStartRef = React.useRef(Date.now());
  const uidRef = React.useRef<string | null>(getCurrentUid());
  const demoRef = React.useRef(false);

  stateRef.current = state;
  betStateRef.current = userBetState;
  demoRef.current = isDemoMode;

  function persistBalanceDelta(uid: string, oldBal: number, newBal: number) {
    if (!uid || demoRef.current) return;
    const o = Math.round(oldBal * 100) / 100;
    const n = Math.round(newBal * 100) / 100;
    if (o === n) return;
    try {
      if (n > o) {
        walletCredit(uid, Math.round((n - o) * 100) / 100, "casino_win", "aviator-sync", "Game win sync");
      } else {
        try {
          walletDebit(uid, Math.round((o - n) * 100) / 100, "casino_bet", "aviator-sync", "Game bet sync");
        } catch {
          persistSetBalance(uid, n, "sync", "Balance sync");
        }
      }
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }

  // Track login/logout/user-switch and pull the correct wallet balance.
  React.useEffect(() => {
    const syncUid = () => {
      const uid = getCurrentUid();
      if (uid !== uidRef.current) {
        uidRef.current = uid;
        if (!uid) {
          setState((prev) => ({ ...prev, userInfo: { ...prev.userInfo, balance: 0 } }));
        } else if (!demoRef.current) {
          const bal = ensureWallet(uid);
          setState((prev) =>
            prev.userInfo.balance === bal ? prev : { ...prev, userInfo: { ...prev.userInfo, balance: bal } }
          );
        }
      }
    };
    syncUid();
    const iv = setInterval(syncUid, 1000);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "letsbet_current_user") syncUid();
    };
    const onFocus = () => syncUid();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(iv);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Pull external wallet changes (deposit, admin top-up, other games) into Aviator/Mines view.
  React.useEffect(() => {
    return subscribeBalance(() => {
      const uid = uidRef.current;
      if (!uid || demoRef.current) return;
      const walletBal = getBalance(uid);
      setState((prev) =>
        Math.round(prev.userInfo.balance * 100) / 100 === Math.round(walletBal * 100) / 100
          ? prev
          : { ...prev, userInfo: { ...prev.userInfo, balance: walletBal } }
      );
    });
  }, []);

  const setDemoMode = (val: boolean) => {
    setIsDemoMode(val);
    demoRef.current = val;
    if (val) {
      const s = { ...stateRef.current };
      s.userInfo.balance = 100000;
      s.userInfo.userName = "Demo Player";
      setState(s);
    } else {
      const uid = uidRef.current;
      if (uid) {
        const bal = ensureWallet(uid);
        setState((prev) => ({ ...prev, userInfo: { ...prev.userInfo, balance: bal } }));
      }
    }
  };

  const updateResponsibleGaming = (attrs: Partial<ResponsibleGamingState>) => {
    setResponsibleGaming((prev) => {
      const updated = { ...prev, ...attrs };
      localStorage.setItem("aviator_responsible_gaming", JSON.stringify(updated));
      return updated;
    });
  };

  const update = (attrs: Partial<ContextDataType>) => {
    // Persist any balance change coming from Mines or other context consumers.
    if (attrs.userInfo && typeof attrs.userInfo.balance === "number") {
      const uid = uidRef.current;
      const newBal = attrs.userInfo.balance;
      if (uid && !demoRef.current) {
        const oldBal = stateRef.current.userInfo.balance;
        if (Math.round(oldBal * 100) / 100 !== Math.round(newBal * 100) / 100) {
          persistBalanceDelta(uid, oldBal, newBal);
        }
      }
    }
    setState((prev) => ({ ...prev, ...attrs }));
  };

  const updateUserBetState = (attrs: Partial<UserStatusType>) => {
    setUserBetState((prev) => ({ ...prev, ...attrs }));
  };

  const getMyBets = () => {};

  React.useEffect(function () {
    unityContext.on("GameController", function (message) {
      if (message === "Ready") {
        setUnity({
          currentProgress: 100,
          unityLoading: true,
          unityState: true,
        });
      }
    });
    unityContext.on("progress", (progression) => {
      const currentProgress = progression * 100;
      if (progression === 1) {
        setUnity({ currentProgress, unityLoading: true, unityState: true });
      } else {
        setUnity({ currentProgress, unityLoading: false, unityState: false });
      }
    });
    return () => unityContext.removeAllEventListeners();
  }, []);

  useEffect(() => {
    cashOutHandler = (at: number, index: "f" | "s") => {
      const s = { ...stateRef.current };
      const b = { ...betStateRef.current };
      const bet = { ...s.userInfo[index] };

      if (bet.cashouted) return;

      const payout = bet.betAmount * at;
      const oldBal = s.userInfo.balance;
      s.userInfo = { ...s.userInfo, [index]: bet };
      s.userInfo.balance = Math.round((oldBal + payout) * 100) / 100;
      bet.cashouted = true;
      bet.cashAmount = payout;
      bet.betted = false;
      s.userInfo = { ...s.userInfo, [index]: bet };
      b[`${index}betted`] = false;
      b[`${index}betState`] = false;

      const uid = uidRef.current;
      if (uid) persistBalanceDelta(uid, oldBal, s.userInfo.balance);

      setState(s);
      setUserBetState(b);
    };
    return () => {
      cashOutHandler = null;
    };
  }, []);

  useEffect(() => {
    gameActiveRef.current = true;
    let cancelled = false;

    const waitUntilLocal = async (ts: number): Promise<boolean> => {
      for (;;) {
        const remain = ts - Date.now();
        if (remain <= 0) return true;
        if (!gameActiveRef.current || cancelled) return false;
        await delay(Math.min(remain, 200));
      }
    };

    const startRound = async () => {
      while (gameActiveRef.current && !cancelled) {
        const st = await fetchRoundState();
        if (cancelled || !gameActiveRef.current) break;

        if (st.history && st.history.length) setHistory(st.history);

        if (st.msIntoPhase >= st.betMs) {
          const nextBoundaryLocal = Date.now() + (st.roundMs - st.msIntoPhase);
          if (!(await waitUntilLocal(nextBoundaryLocal))) break;
          continue;
        }

        const crashPoint = st.current;
        const betEndLocal = Date.now() + (st.betMs - st.msIntoPhase);
        const roundEndLocal = betEndLocal + st.playMs + st.endMs;
        const roundId = `R${Date.now()}-${Math.floor(Math.random() * 9999)}`;

        setCurrentRoundId(roundId);
        setWatcherCount(generateWatcherCount());

        setPreviousHand((prev) => {
          const s = stateRef.current;
          const users: BettedUserType[] = [];
          for (const idx of ["f", "s"] as const) {
            const bet = s.userInfo[idx];
            if (bet.betted) {
              users.push({
                name: "You",
                betAmount: bet.betAmount,
                cashOut: 0,
                cashouted: false,
                target: 0,
                img: "",
                roundId,
              });
            }
          }
          return users;
        });

        const fakeUsers = generateFakePlayers(crashPoint);
        const usersWithRound = fakeUsers.map((u) => ({ ...u, roundId }));
        setBettedUsers(usersWithRound as BettedUserType[]);

        const roundTotalBets = usersWithRound.reduce((sum, u) => sum + u.betAmount, 0);
        setTotalBets(roundTotalBets);
        setTotalCashout(0);

        // Record round for provably fair
        setRoundHistory((prev) => {
          const newRound: ProvablyFairRound = {
            serverSeed: st.serverSeed || "unknown",
            clientSeed: st.clientSeed || "unknown",
            nonce: st.nonce || 0,
            crashPoint,
            hash: st.hash || "",
            timestamp: Date.now(),
            roundId,
          };
          const updated = [newRound, ...prev];
          if (updated.length > 100) updated.length = 100;
          return updated;
        });

        setGameState({
          GameState: "BET",
          currentNum: 0,
          currentSecondNum: 0,
          time: Math.max(0, st.msIntoPhase),
          speed: 1,
        });

        if (!(await waitUntilLocal(betEndLocal))) break;

        // Fixed flight duration: every round flies at the same speed so the
        // pace reveals nothing about the crash point.
        setGameState({
          GameState: "PLAYING",
          currentNum: crashPoint,
          currentSecondNum: 0,
          time: 0,
          speed: 1,
        });

        await delay(Math.min(FLIGHT_MS, st.playMs));
        if (!gameActiveRef.current || cancelled) break;

        setGameState({
          GameState: "GAMEEND",
          currentNum: crashPoint,
          currentSecondNum: 0,
          time: 0,
          speed: 1,
        });

        // Set final total cashout
        const finalCashout = usersWithRound
          .filter((u) => u.cashouted)
          .reduce((sum, u) => sum + u.cashOut, 0);
        setTotalCashout(finalCashout);

        processGameEnd();

        if (!(await waitUntilLocal(roundEndLocal))) break;
      }
    };

    startRound();

    return () => {
      cancelled = true;
      gameActiveRef.current = false;
    };
  }, []);

  const processGameEnd = () => {
    const s = { ...stateRef.current };
    const b = { ...betStateRef.current };
    const myBets = [...s.myBets];

    for (const index of ["f", "s"] as const) {
      const bet = { ...s.userInfo[index] };

      if (bet.betted) {
        if (bet.cashouted) {
          myBets.unshift({
            _id: myBets.length + 1,
            name: "You",
            betAmount: bet.betAmount,
            cashoutAt: Math.round((bet.cashAmount / bet.betAmount) * 100) / 100,
            cashouted: true,
            date: Date.now(),
          });
        } else {
          myBets.unshift({
            _id: myBets.length + 1,
            name: "You",
            betAmount: bet.betAmount,
            cashoutAt: 0,
            cashouted: false,
            date: Date.now(),
          });
        }
      }

      bet.betted = false;
      bet.cashouted = false;
      bet.cashAmount = 0;
      s.userInfo = { ...s.userInfo, [index]: bet };
      b[`${index}betted`] = false;

      const auto = bet.auto;
      if (auto) {
        if (bet.cashouted) {
        } else {
          if (index === "f") {
            fDecreaseAmount += bet.betAmount;
            if (s.fdeState && s.fdecrease - fDecreaseAmount <= 0) {
              s.userInfo.f.auto = false;
              b.fbetState = false;
              fDecreaseAmount = 0;
            } else {
              s.userInfo.f.auto = true;
              b.fbetState = true;
            }
          } else {
            sDecreaseAmount += bet.betAmount;
            if (s.sdeState && s.sdecrease - sDecreaseAmount <= 0) {
              s.userInfo.s.auto = false;
              b.sbetState = false;
              sDecreaseAmount = 0;
            } else {
              s.userInfo.s.auto = true;
              b.sbetState = true;
            }
          }
        }
      }
    }

    if (myBets.length > 100) myBets.length = 100;
    s.myBets = myBets;
    setState(s);
    setUserBetState(b);
  };

  React.useEffect(() => {
    let s = stateRef.current;
    let betStatus = betStateRef.current;

    // Check responsible gaming limits
    const rg = responsibleGaming;
    if (rg.selfExcluded) {
      toast.error("Your account is self-excluded. Please contact support.");
      return;
    }
    if (rg.coolOffUntil && Date.now() < rg.coolOffUntil) {
      const mins = Math.ceil((rg.coolOffUntil - Date.now()) / 60000);
      toast.error(`Cool-off period active. ${mins} minutes remaining.`);
      return;
    }
    if (rg.sessionLimit > 0) {
      const elapsed = (Date.now() - sessionStartRef.current) / 60000;
      if (elapsed >= rg.sessionLimit) {
        toast.error("Session time limit reached. Please take a break.");
        return;
      }
    }

    // Locked accounts cannot place new bets — balance is frozen.
    const lockUid = uidRef.current;
    if (lockUid && isBlocked(lockUid)) {
      if (betStatus.fbetState || betStatus.sbetState) {
        toast.error("Account locked — please contact Support to unlock.");
      }
      betStatus.fbetState = false;
      betStatus.sbetState = false;
      setUserBetState({ ...betStatus });
      return;
    }

    if (gameState.GameState === "BET") {
      if (betStatus.fbetState) {
        if (s.userInfo.f.auto) {
          if (s.fautoCound > 0) {
            s.fautoCound -= 1;
          } else {
            s.userInfo.f.auto = false;
            betStatus.fbetState = false;
            setState({ ...s });
            setUserBetState({ ...betStatus });
            return;
          }
        }
        if (s.userInfo.f.betAmount < 10) {
          toast.error("Minimum bet on Aviator is $10");
          betStatus.fbetState = false;
          betStatus.fbetted = false;
          setState({ ...s });
          setUserBetState({ ...betStatus });
          return;
        }
        if (s.userInfo.balance < 10) {
          toast.error("You need at least $10 to play Aviator");
          betStatus.fbetState = false;
          betStatus.fbetted = false;
          setState({ ...s });
          setUserBetState({ ...betStatus });
          return;
        }
        if (s.userInfo.balance - s.userInfo.f.betAmount < 0) {
          toast.error("Your balance is not enough");
          betStatus.fbetState = false;
          betStatus.fbetted = false;
          setState({ ...s });
          setUserBetState({ ...betStatus });
          return;
        }
        {
          const oldBal = s.userInfo.balance;
          s.userInfo.balance = Math.round((oldBal - s.userInfo.f.betAmount) * 100) / 100;
          const uid = uidRef.current;
          if (uid) persistBalanceDelta(uid, oldBal, s.userInfo.balance);
        }
        s.userInfo.f.betted = true;
        betStatus.fbetState = false;
        betStatus.fbetted = true;
        setState({ ...s });
        setUserBetState({ ...betStatus });
      }
      if (betStatus.sbetState) {
        if (s.userInfo.s.auto) {
          if (s.sautoCound > 0) {
            s.sautoCound -= 1;
          } else {
            s.userInfo.s.auto = false;
            betStatus.sbetState = false;
            setState({ ...s });
            setUserBetState({ ...betStatus });
            return;
          }
        }
        if (s.userInfo.s.betAmount < 10) {
          toast.error("Minimum bet on Aviator is $10");
          betStatus.sbetState = false;
          betStatus.sbetted = false;
          setState({ ...s });
          setUserBetState({ ...betStatus });
          return;
        }
        if (s.userInfo.balance < 10) {
          toast.error("You need at least $10 to play Aviator");
          betStatus.sbetState = false;
          betStatus.sbetted = false;
          setState({ ...s });
          setUserBetState({ ...betStatus });
          return;
        }
        if (s.userInfo.balance - s.userInfo.s.betAmount < 0) {
          toast.error("Your balance is not enough");
          betStatus.sbetState = false;
          betStatus.sbetted = false;
          setState({ ...s });
          setUserBetState({ ...betStatus });
          return;
        }
        {
          const oldBal = s.userInfo.balance;
          s.userInfo.balance = Math.round((oldBal - s.userInfo.s.betAmount) * 100) / 100;
          const uid = uidRef.current;
          if (uid) persistBalanceDelta(uid, oldBal, s.userInfo.balance);
        }
        s.userInfo.s.betted = true;
        betStatus.sbetState = false;
        betStatus.sbetted = true;
        setState({ ...s });
        setUserBetState({ ...betStatus });
      }
    }
  }, [gameState.GameState, userBetState.fbetState, userBetState.sbetState]);

  return (
    <Context.Provider
      value={{
        state: state,
        ...betLimit,
        ...userBetState,
        ...unity,
        ...gameState,
        currentTarget,
        rechargeState,
        myUnityContext: unityContext,
        bettedUsers: [...bettedUsers],
        previousHand: [...previousHand],
        history: [...history],
        watcherCount,
        totalBets,
        totalCashout,
        currentRoundId,
        isDemoMode,
        responsibleGaming,
        roundHistory,
        setCurrentTarget,
        update,
        getMyBets,
        updateUserBetState,
        setDemoMode,
        updateResponsibleGaming,
      }}
    >
      {children}
    </Context.Provider>
  );
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default Context;
