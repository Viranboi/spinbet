/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import "./crash.scss";
import Unity from "react-unity-webgl";
import Context from "../../context";
import { multiplierAtElapsed } from "../../gameEngine";
import { playCrashSound, playWaitingTick, startRoundMusic, fadeOutMusic } from "../../sounds";

let currentFlag = 0;

export default function WebGLStarter() {
  const { GameState, currentNum, time, unityState, myUnityContext, setCurrentTarget } =
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
  const basePlayers = React.useRef(4800);
  const [livePlayers, setLivePlayers] = React.useState(4800);

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
        basePlayers.current = Math.floor(Math.random() * 1500) + 3500;
        setLivePlayers(Math.min(5000, basePlayers.current));
      }

      let startTime = Date.now() - time;
      const crash = currentNum;
      const getCurrentTime = (e) => {
        // Constant speed: same shared exponential curve in real time on every
        // round. 2x ends after ~2s, 200x after ~15s — identical climb, pace
        // reveals nothing about the crash point.
        const elapsedSec = (Date.now() - startTime) / 1000;
        const currentMult = multiplierAtElapsed(crash, elapsedSec);

        const drop = Math.floor((currentMult - 1) * 800);
        setLivePlayers(Math.min(5000, Math.max(800, basePlayers.current - drop)));

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
        if (tickSec > lastWaitingRef.current && tickSec < 10) {
          lastWaitingRef.current = tickSec;
          playWaitingTick(elapsedSec * 1000);
        }
      }, 20);
    }
    return () => clearInterval(myInterval);
  }, [GameState, unityState]);

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
        {GameState === "PLAYING" ? (
          <div className="crashtext">
            <div>
              {target - 0.01 >= 1
                ? parseFloat(Number(target - 0.01).toFixed(2))
                : "1.00"}{" "}
              <span className="font-[900]">x</span>
            </div>
          </div>
        ) : GameState === "GAMEEND" ? (
          <div className="crashtext red">
            <div className="flew-away">FLEW AWAY!</div>
            <div>
              {parseFloat(Number(currentNum).toFixed(2))}{" "}
              <span className="font-[900]">x</span>
            </div>
          </div>
        ) : (
          <div className="crash-badge-layer">
            <img
              src="/assets/spribe-official-game.png"
              alt="SPRIBE Official Game"
              className="crash-badge-img"
            />
            <div className="crash-badge-content">
              <div className="crash-badge-waiting">
                <div className="waiting-sub">Next round starts soon</div>
                <div className="waiting-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="waiting-bar-wrapper">
                  <div className="waiting-bar" style={{ width: `${(4000 - waiting) * 100 / 4000}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
