/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import {
  computeCrashPoint,
  findCrashTime,
  generateFakePlayers,
  generateInitialHistory,
  newServerSeed,
  newClientSeed,
} from "./gameEngine";
import type { FakePlayer } from "./gameEngine";

export interface BettedUserType {
  name: string;
  betAmount: number;
  cashOut: number;
  cashouted: boolean;
  target: number;
  img: string;
  bot?: boolean;
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
  currentTarget: number;
  setCurrentTarget(attrs: Partial<number>);
  update(attrs: Partial<ContextDataType>);
  getMyBets();
  updateUserBetState(attrs: Partial<UserStatusType>);
}

const init_state: ContextDataType = {
  myBets: [],
  width: 1500,
  userInfo: {
    balance: 5000,
    userType: false,
    img: "",
    userName: "Player",
    f: {
      auto: false,
      betted: false,
      cashouted: false,
      cashAmount: 0,
      betAmount: 20,
      target: 2,
    },
    s: {
      auto: false,
      betted: false,
      cashouted: false,
      cashAmount: 0,
      betAmount: 20,
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
};

const Context = React.createContext<ContextType>(null!);

let cashOutHandler: ((at: number, index: "f" | "s") => void) | null = null;

export const callCashOut = (at: number, index: "f" | "s") => {
  cashOutHandler?.(at, index);
};

let fIncreaseAmount = 0;
let fDecreaseAmount = 0;
let sIncreaseAmount = 0;
let sDecreaseAmount = 0;

export const Provider = ({ children }: any) => {
  const [state, setState] = React.useState<ContextDataType>({ ...init_state });
  const [gameState, setGameState] = React.useState<GameStatusType>({
    currentNum: 0,
    currentSecondNum: 0,
    GameState: "",
    time: 0,
  });

  const [bettedUsers, setBettedUsers] = React.useState<BettedUserType[]>([]);
  const [previousHand, setPreviousHand] = React.useState<BettedUserType[]>([]);
  const [history, setHistory] = React.useState<number[]>(
    generateInitialHistory()
  );
  const [userBetState, setUserBetState] = React.useState<UserStatusType>({
    fbetState: false,
    fbetted: false,
    sbetState: false,
    sbetted: false,
  });
  const [rechargeState, setRechargeState] = React.useState(false);
  const [currentTarget, setCurrentTarget] = React.useState(0);
  const [betLimit] = React.useState<GameBetLimit>({ maxBet: 10000, minBet: 1 });

  const stateRef = React.useRef(state);
  const betStateRef = React.useRef(userBetState);
  const gameActiveRef = React.useRef(true);

  stateRef.current = state;
  betStateRef.current = userBetState;

  const update = (attrs: Partial<ContextDataType>) => {
    setState((prev) => ({ ...prev, ...attrs }));
  };

  const updateUserBetState = (attrs: Partial<UserStatusType>) => {
    setUserBetState((prev) => ({ ...prev, ...attrs }));
  };

  const getMyBets = () => {};

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

    const startRound = async () => {
      let serverSeed = newServerSeed();
      let clientSeed = newClientSeed();
      let nonce = 0;
      let localHistory = [...history];

      while (gameActiveRef.current) {
        const crashPoint = await computeCrashPoint(serverSeed, clientSeed, nonce);
        nonce++;

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
              });
            }
          }
          return users;
        });

        const fakeUsers = generateFakePlayers(crashPoint);
        setBettedUsers(fakeUsers as BettedUserType[]);

        setGameState({
          GameState: "BET",
          currentNum: 0,
          currentSecondNum: 0,
          time: 0,
        });

        await delay(5000);
        if (!gameActiveRef.current) break;

        setGameState({
          GameState: "PLAYING",
          currentNum: crashPoint,
          currentSecondNum: 0,
          time: 0,
        });

        const crashDuration = findCrashTime(crashPoint) * 1000;
        await delay(crashDuration);
        if (!gameActiveRef.current) break;

        setGameState({
          GameState: "GAMEEND",
          currentNum: crashPoint,
          currentSecondNum: 0,
          time: 0,
        });

        localHistory.unshift(crashPoint);
        if (localHistory.length > 123) localHistory.pop();
        setHistory([...localHistory]);

        processGameEnd();

        await delay(3000);
        if (!gameActiveRef.current) break;
      }
    };

    startRound();

    return () => {
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
        unityState: true,
        unityLoading: true,
        currentProgress: 100,
        ...gameState,
        currentTarget,
        rechargeState,
        bettedUsers: [...bettedUsers],
        previousHand: [...previousHand],
        history: [...history],
        setCurrentTarget,
        update,
        getMyBets,
        updateUserBetState,
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
