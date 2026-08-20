/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import "./crash.scss";
import propeller from "../../assets/images/propeller.png";
import Context from "../../context";

export default function WebGLStarter() {
  const { GameState, currentNum, time, setCurrentTarget } =
    React.useContext(Context);
  const [target, setTarget] = React.useState(1);
  const [waiting, setWaiting] = React.useState(0);

  React.useEffect(() => {
    let myInterval: any;
    if (GameState === "PLAYING") {
      let startTime = Date.now() - time;
      let currentTime;
      let currentMult;
      const getCurrentTime = () => {
        currentTime = (Date.now() - startTime) / 1000;
        currentMult =
          1 +
          0.06 * currentTime +
          Math.pow(0.06 * currentTime, 2) -
          Math.pow(0.04 * currentTime, 3) +
          Math.pow(0.04 * currentTime, 4);
        setTarget(currentMult);
        setCurrentTarget(currentMult);
      };
      myInterval = setInterval(() => {
        getCurrentTime();
      }, 20);
    } else if (GameState === "GAMEEND") {
      setTarget(currentNum);
      setCurrentTarget(currentNum);
    } else if (GameState === "BET") {
      let startWaiting = Date.now() - time;
      setTarget(1);
      setCurrentTarget(1);

      myInterval = setInterval(() => {
        setWaiting(Date.now() - startWaiting);
      }, 20);
    }
    return () => clearInterval(myInterval);
  }, [GameState]);

  return (
    <div className="crash-container">
      <div className="canvas">
        <div
          style={{
            width: "100%",
            height: "100%",
            background:
              GameState === "PLAYING"
                ? `radial-gradient(ellipse at center, rgba(124,58,237,0.3) 0%, rgba(30,0,60,0.95) 70%)`
                : GameState === "GAMEEND"
                ? `radial-gradient(ellipse at center, rgba(220,38,38,0.3) 0%, rgba(30,0,0,0.95) 70%)`
                : `radial-gradient(ellipse at center, rgba(55,0,80,0.3) 0%, rgba(10,0,30,0.95) 70%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {GameState === "PLAYING" && (
            <div
              style={{
                position: "absolute",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)",
                animation: "pulse 2s ease-in-out infinite",
                bottom: "20%",
                left: `${Math.min(80, 10 + (target - 1) * 5)}%`,
                transition: "left 0.1s linear",
              }}
            />
          )}
          {GameState === "GAMEEND" && (
            <div
              style={{
                position: "absolute",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(220,38,38,0.5) 0%, transparent 70%)",
                bottom: "15%",
                left: "75%",
              }}
            />
          )}
        </div>
      </div>
      <div className="crash-text-container">
        {GameState === "BET" ? (
          <div className={`crashtext wait font-9`}>
            <div className="rotate">
              <img width={100} height={100} src={propeller} alt="propellar"></img>
            </div>
            <div className="waiting-font">WAITING FOR NEXT ROUND</div>
            <div className="waiting">
              <div
                style={{
                  width: `${((5000 - (waiting % 5000)) * 100) / 5000}%`,
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div className={`crashtext ${GameState === "GAMEEND" && "red"}`}>
            {GameState === "GAMEEND" && (
              <div className="flew-away">FLEW AWAY!</div>
            )}
            <div>
              {target - 0.01 >= 1
                ? Number(target - 0.01).toFixed(2)
                : "1.00"}{" "}
              <span className="font-[900]">x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
