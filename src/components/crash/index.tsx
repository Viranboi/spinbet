/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import "./crash.scss";
import Unity from "react-unity-webgl";
import propeller from "../../assets/images/propeller.png";
import Context from "../../context";
import { playCrashSound, playWaitingTick, startRoundMusic, fadeOutMusic } from "../../sounds";

let currentFlag = 0;

export default function WebGLStarter() {
  const { GameState, currentNum, time, speed, unityState, myUnityContext, setCurrentTarget } =
    React.useContext(Context);
  const [target, setTarget] = React.useState(1);
  const [waiting, setWaiting] = React.useState(0);
  const [flag, setFlag] = React.useState(1);
  const [canvasReady, setCanvasReady] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tickCounterRef = React.useRef(0);
  const lastCrashRef = React.useRef(false);
  const lastWaitingRef = React.useRef(0);
  const musicStartedRef = React.useRef(false);
  const basePlayers = React.useRef(5900);
  const [livePlayers, setLivePlayers] = React.useState(5900);

  const avatarSets = React.useRef([
    ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=80&h=80&fit=crop"],
    ["https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=80&h=80&fit=crop"],
    ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=80&h=80&fit=crop"],
    ["https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1500534623283-312aade485b7?w=80&h=80&fit=crop"],
    ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=80&h=80&fit=crop","https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=80&h=80&fit=crop"],
  ]);
  const [avatarIdx, setAvatarIdx] = React.useState(0);

  React.useEffect(() => {
    let rafId: number;
    const id = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        setCanvasReady(true);
      });
    });
    return () => {
      cancelAnimationFrame(id);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);

  React.useEffect(() => {
    let myInterval;
    if (GameState === "PLAYING") {
      setFlag(2);
      lastCrashRef.current = false;
      tickCounterRef.current = 0;

      if (!musicStartedRef.current) {
        musicStartedRef.current = true;
        startRoundMusic();
        basePlayers.current = Math.floor(Math.random() * 2000) + 5000;
        setLivePlayers(basePlayers.current);
      }

      let startTime = Date.now() - time;
      let currentTime;
      let currentMult;
      const getCurrentTime = (e) => {
        currentTime = ((Date.now() - startTime) / 1000) * (speed || 1);
        currentMult =
          1 +
          0.06 * currentTime +
          Math.pow(0.06 * currentTime, 2) -
          Math.pow(0.04 * currentTime, 3) +
          Math.pow(0.04 * currentTime, 4);

        const drop = Math.floor((currentMult - 1) * 800);
        setLivePlayers(Math.max(1200, basePlayers.current - drop));

        if (currentMult > 2 && e === 2) {
          setFlag(3);
        } else if (currentMult > 10 && e === 3) {
          setFlag(4);
        }
        setTarget(currentMult);
        setCurrentTarget(currentMult);
      };
      myInterval = setInterval(() => {
        getCurrentTime(currentFlag);
      }, 10);
    } else if (GameState === "GAMEEND") {
      setFlag(5);
      setCurrentTarget(currentNum);
      setTarget(currentNum);
      musicStartedRef.current = false;
      fadeOutMusic(250);
      if (!lastCrashRef.current) {
        lastCrashRef.current = true;
        setTimeout(() => playCrashSound(), 100);
      }
    } else if (GameState === "BET") {
      setFlag(1);
      let startWaiting = Date.now() - time;
      setTarget(1);
      setCurrentTarget(1);
      lastWaitingRef.current = 0;
      setAvatarIdx(Math.floor(Math.random() * avatarSets.current.length));

      myInterval = setInterval(() => {
        const w = Date.now() - startWaiting;
        setWaiting(w);
        const elapsedSec = w / 1000;
        const tickSec = Math.floor(elapsedSec);
        if (tickSec > lastWaitingRef.current && tickSec < 5) {
          lastWaitingRef.current = tickSec;
          playWaitingTick(elapsedSec * 1000);
        }
      }, 20);
    }
    return () => clearInterval(myInterval);
  }, [GameState, unityState, speed]);

  React.useEffect(() => {
    myUnityContext?.send("GameManager", "RequestToken", JSON.stringify({
      gameState: flag
    }));
    currentFlag = flag;
  }, [flag, myUnityContext]);

  return (
    <div className="crash-container" ref={containerRef}>
      <div className="canvas">
        {canvasReady && <Unity unityContext={myUnityContext} matchWebGLToCanvasSize={true} />}
      </div>
      <div className="crash-live-strip">
        <div className="crash-live-avatars">
          <div className="crash-live-avatar"><img src={avatarSets.current[avatarIdx][0]} alt="" /></div>
          <div className="crash-live-avatar"><img src={avatarSets.current[avatarIdx][1]} alt="" /></div>
          <div className="crash-live-avatar"><img src={livePlayers > 4000 ? avatarSets.current[avatarIdx][2] : livePlayers > 2500 ? "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=80&h=80&fit=crop" : "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=80&h=80&fit=crop"} alt="" /></div>
        </div>
        <div className="crash-live-count">{livePlayers.toLocaleString()}</div>
      </div>
      <div className="crash-text-container">
        {GameState === "BET" ? (
          <div className={`crashtext wait font-9`}>
            <div className="rotate">
              <img width={100} height={100} src={propeller} alt="propellar"></img>
            </div>
            <div className="waiting-font">WAITING FOR NEXT ROUND</div>
            <div className="waiting">
              <div style={{ width: `${(5000 - waiting) * 100 / 5000}%` }}></div>
            </div>
          </div>
        ) : (
          <div className={`crashtext ${GameState === "GAMEEND" && "red"}`}>
            {GameState === "GAMEEND" && <div className="flew-away">FLEW AWAY!</div>}
            <div>
              {GameState === "GAMEEND"
                ? parseFloat(Number(currentNum).toFixed(2))
                : target - 0.01 >= 1
                ? parseFloat(Number(target - 0.01).toFixed(2))
                : "1.00"}{" "}
              <span className="font-[900]">x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
