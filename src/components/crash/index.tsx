/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import "./crash.scss";
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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tickCounterRef = React.useRef(0);
  const lastCrashRef = React.useRef(false);
  const lastWaitingRef = React.useRef(0);
  const musicStartedRef = React.useRef(false);
  const basePlayers = React.useRef(4800);
  const [livePlayers, setLivePlayers] = React.useState(4800);
  // Round clock survives re-renders (e.g. Unity load flipping unityState
  // mid-flight). Without this the timer restarted at 1.00x mid-round and the
  // counter visibly jumped backwards.

  const avatarSets = React.useRef([
    ["/avatars/av-3.png","/avatars/av-4.png","/avatars/av-5.png"],
    ["/avatars/av-12.png","/avatars/av-13.png","/avatars/av-14.png"],
    ["/avatars/av-15.png","/avatars/av-39.png","/avatars/av-45.png"],
    ["/avatars/av-3.png","/avatars/av-12.png","/avatars/av-15.png"],
    ["/avatars/av-4.png","/avatars/av-13.png","/avatars/av-39.png"],
  ]);
  const [avatarIdx, setAvatarIdx] = React.useState(0);

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

      const startTime = Date.now() - time;
      const crash = currentNum;
      const getCurrentTime = (e) => {
        const elapsedSec = (Date.now() - startTime) / 1000;
        const currentMult = multiplierAtElapsed(crash, elapsedSec);

        const drop = Math.floor((currentMult - 1) * 800);
        setLivePlayers(Math.min(5000, Math.max(800, basePlayers.current - drop)));

        if (currentMult > 2 && e === 2) {
          setFlag(3);
        } else if (currentMult > 10 && e === 3) {
          setFlag(4);
        }
        // Monotonic: the counter never steps backwards within a round.
        setTarget((prev) => Math.max(prev, currentMult));
        setCurrentTarget(currentMult);
      };
      myInterval = setInterval(() => {
        getCurrentTime(currentFlag);
      }, 50);
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
        {null}
      </div>
      <div className="crash-live-strip">
        <div className="crash-live-avatars">
          <div className="crash-live-avatar"><img src={avatarSets.current[avatarIdx][0]} alt="" /></div>
          <div className="crash-live-avatar"><img src={avatarSets.current[avatarIdx][1]} alt="" /></div>
          <div className="crash-live-avatar"><img src={livePlayers > 4000 ? avatarSets.current[avatarIdx][2] : livePlayers > 2500 ? "/avatars/av-13.png" : "/avatars/av-14.png"} alt="" /></div>
        </div>
        <div className="crash-live-count">{livePlayers.toLocaleString()}</div>
      </div>
      <div className="crash-text-container">
        {GameState === "PLAYING" ? (
          <div className="crashtext">
            <div>
              {target.toFixed(2)}{" "}
              <span className="font-[900]">x</span>
            </div>
          </div>
        ) : GameState === "GAMEEND" ? (
          <div className="crashtext red">
            <div className="flew-away">FLEW AWAY!</div>
            <div>
              {Number(currentNum).toFixed(2)}{" "}
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
