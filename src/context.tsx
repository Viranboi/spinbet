/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { UnityContext } from "react-unity-webgl";
import { toast } from "react-toastify";
import { generateFakePlayers, generateWatcherCount } from "./gameEngine";
import { crashTimeFor, fetchRoundState } from "./upcomingOdds";
import { ensureWallet } from "./p2p/wallet";

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
  const [betLimit] = React.useState<GameBetLimit>({ maxBet: 90000, minBet: 100 });
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

  stateRef.current = state;
  betStateRef.current = userBetState;

  const setDemoMode = (val: boolean) => {
    setIsDemoMode(val);
    if (val) {
      const s = { ...stateRef.current };
      s.userInfo.balance = 100000;
      s.userInfo.userName = "Demo Player";
      setState(s);
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
      s.userInfo = { ...s.userInfo, [index]: bet };
      s.userInfo.balance += payout;
      bet.cashouted = true;
      bet.cashAmount = payout;
      bet.betted = false;
      s.userInfo = { ...s.userInfo, [index]: bet };
      b[`${index}betted`] = false;
      b[`${index}betState`] = false;

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

        // Calculate speed - consistent and smooth
        const crashSec = crashTimeFor(crashPoint);
        const targetDuration = Math.max(4, Math.min(crashSec * 1.3, 8));
        const speed = crashSec / targetDuration;

        setGameState({
          GameState: "PLAYING",
          currentNum: crashPoint,
          currentSecondNum: 0,
          time: 0,
          speed,
        });

        await delay(Math.min(targetDuration * 1000, st.playMs));
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
        if (s.userInfo.balance - s.userInfo.f.betAmount < 0) {
          toast.error("Your balance is not enough");
          betStatus.fbetState = false;
          betStatus.fbetted = false;
          setState({ ...s });
          setUserBetState({ ...betStatus });
          return;
        }
        s.userInfo.balance -= s.userInfo.f.betAmount;
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
        if (s.userInfo.balance - s.userInfo.s.betAmount < 0) {
          toast.error("Your balance is not enough");
          betStatus.sbetState = false;
          betStatus.sbetted = false;
          setState({ ...s });
          setUserBetState({ ...betStatus });
          return;
        }
        s.userInfo.balance -= s.userInfo.s.betAmount;
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
