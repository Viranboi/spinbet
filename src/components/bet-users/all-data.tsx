import React from "react"
import { BettedUserType } from "../../context";
import { useCurrency } from "../../currency";

interface AllDataProps {
    pre: boolean
    setPre: React.Dispatch<React.SetStateAction<boolean>>
    allData: BettedUserType[]
    activePlayers: number
    totalBets: number
    totalCashout: number
    watcherCount: number
}

const AllData = ({ pre, setPre, allData, activePlayers, totalBets, totalCashout, watcherCount }: AllDataProps) => {
    const { num, symbol, fmt } = useCurrency();
    return (
        <>
            <div>
                <div className="all-bets-block">
                    <div>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>ALL BETS</div>
                        <div style={{ color: "#9ea0a3", fontSize: "11px", marginTop: "2px" }}>
                            {activePlayers.toLocaleString()} players
                        </div>
                    </div>
                    <div className={`previous-hand items-center flex justify-between ${pre ? "click" : ""}`}>
                        <div className="history-i"></div>
                        <span className="ml-1" onClick={() => { setPre(!pre) }}>Previous</span>
                    </div>
                </div>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 12px 6px",
                    fontSize: "11px",
                    color: "#555",
                }}>
                    <span>{activePlayers.toLocaleString()} / {watcherCount.toLocaleString()} Bets</span>
                    <span style={{ color: "#8be35d", fontWeight: 600 }}>
                        {num(totalCashout)} Total win {symbol}
                    </span>
                </div>
                <div className="spacer"></div>
                <div className="legend">
                    <span className="user">Player</span>
                    <span className="bet">Bet {symbol}</span>
                    <span>X</span>
                    <span className="cash-out">Win {symbol}</span>
                </div>
            </div>
            <div className="cdk-virtual-scroll-viewport">
                <div className="cdk-virtual-scroll-content-wrapper">
                    {allData?.map((user, key) => (
                        <div className={`bet-item ${user.cashouted ? "celebrated" : ""}`} key={key}>
                            <div className="user">
                                {user.img ?
                                    <img className="avatar" src={user.img} alt="avatar" /> :
                                    <img className="avatar" src="./avatars/av-5.png" alt="avatar" />
                                }
                                <div className="username">{user.name?.length > 10 ? user.name?.slice(0, 1) + "***" + user.name?.slice(-1) : user.name}</div>
                            </div>
                            <div className="bet">
                                {num(Number(user.betAmount))}
                            </div>
                            {user.cashouted &&
                                <div className="multiplier-block">
                                    <div className="bubble">{parseFloat(Number(user.target).toFixed(2))}</div>
                                </div>
                            }
                            <div className="cash-out">{Number(user.cashOut) > 0 ? num(Number(user.cashOut)) : ""}</div>
                        </div>
                    ))}
                </div>
            </div>
            {!pre && <div className="bets-live-summary">
                <span><i className="live-dot" /> Live players</span>
                <strong>{activePlayers.toLocaleString()}</strong>
                <span className="cashout-label">Watching</span>
                <strong className="cashout-value">{watcherCount.toLocaleString()}</strong>
            </div>}
            {!pre && <div className="bets-live-summary" style={{ marginTop: "2px" }}>
                <span style={{ color: "#555" }}>Total bets</span>
                <strong style={{ color: "#9ea0a3" }}>{fmt(totalBets)}</strong>
                <span className="cashout-label">Cashout</span>
                <strong className="cashout-value">{fmt(totalCashout)}</strong>
            </div>}
        </>
    )
};

export default AllData;
