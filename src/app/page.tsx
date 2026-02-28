"use client";

import { useState, useCallback } from "react";
import { cn, TILES, type Tile, getTileColor } from "@/lib/utils";

type RPS = "가위" | "바위" | "보";
const RPS_OPTIONS: RPS[] = ["가위", "바위", "보"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BlackWhitePage() {
  const [phase, setPhase] = useState<"rps" | "game" | "result">("rps");
  const [rpsResult, setRpsResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [userFirst, setUserFirst] = useState(true);

  const [userTiles, setUserTiles] = useState<Tile[]>([]);
  const [cpuTiles, setCpuTiles] = useState<Tile[]>([]);
  const [userUsed, setUserUsed] = useState<Set<number>>(new Set());
  const [cpuUsed, setCpuUsed] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [userSelected, setUserSelected] = useState<Tile | null>(null);
  const [cpuSelected, setCpuSelected] = useState<Tile | null>(null);
  const [roundResult, setRoundResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [roundPhase, setRoundPhase] = useState<"select" | "reveal" | "done">("select");
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [cpuFirstTile, setCpuFirstTile] = useState<Tile | null>(null);
  const [cpuPlayedColors, setCpuPlayedColors] = useState<("black" | "white")[]>([]);
  const [userPlayedTiles, setUserPlayedTiles] = useState<Tile[]>([]);
  const [roundResults, setRoundResults] = useState<("win" | "lose" | "draw")[]>([]);

  const startRps = useCallback(() => {
    setPhase("rps");
    setRpsResult(null);
  }, []);

  const playRps = useCallback((user: RPS) => {
    const cpu: RPS = RPS_OPTIONS[Math.floor(Math.random() * 3)];
    const wins: Record<RPS, RPS> = { 가위: "보", 바위: "가위", 보: "바위" };
    let result: "win" | "lose" | "draw" = "draw";
    if (wins[user] === cpu) result = "win";
    else if (wins[cpu] === user) result = "lose";
    setRpsResult(result);
    setUserFirst(result === "win" || (result === "draw" && Math.random() > 0.5));
  }, []);

  const startGame = useCallback(() => {
    setPhase("game");
    const u = shuffle([...TILES]);
    const c = shuffle([...TILES]);
    setUserTiles(u);
    setCpuTiles(c);
    setUserUsed(new Set());
    setCpuUsed(new Set());
    setRound(0);
    setUserScore(0);
    setCpuScore(0);
    setUserSelected(null);
    setCpuSelected(null);
    setRoundResult(null);
    setRoundPhase("select");
    setIsUserTurn(rpsResult === "win" || (rpsResult === "draw" && userFirst));
    setGameOver(false);
    setSuddenDeath(false);
    setCpuPlayedColors([]);
    setUserPlayedTiles([]);
    setRoundResults([]);
  }, [rpsResult, userFirst]);

  const playRound = useCallback(
    (userTile: Tile) => {
      if (roundPhase !== "select" || !isUserTurn || userUsed.has(userTile)) return;
      const userIdx = userTiles.indexOf(userTile);
      if (userIdx === -1) return;

      setUserSelected(userTile);
      setRoundPhase("reveal");

      const cpuAvailable = TILES.filter((t) => !cpuUsed.has(t));
      const cpuTile = cpuAvailable[Math.floor(Math.random() * cpuAvailable.length)] as Tile;

      setTimeout(() => {
        setCpuSelected(cpuTile);
        const u = userTile;
        const c = cpuTile;
        let result: "win" | "lose" | "draw" = "draw";
        if (u > c) result = "win";
        else if (c > u) result = "lose";
        setRoundResult(result);
        setUserScore((s) => s + (result === "win" ? 1 : 0));
        setCpuScore((s) => s + (result === "lose" ? 1 : 0));
        setUserUsed((prev) => new Set(prev).add(userTile));
        setCpuUsed((prev) => new Set(prev).add(cpuTile));
        setCpuPlayedColors((prev) => [...prev, getTileColor(cpuTile)]);
        setUserPlayedTiles((prev) => [...prev, userTile]);
        setRoundResults((prev) => [...prev, result]);
        setRoundPhase("done");
      }, 600);
    },
    [roundPhase, isUserTurn, userUsed, cpuUsed, userTiles]
  );

  const nextRound = useCallback(() => {
    setUserSelected(null);
    setCpuSelected(null);
    setRoundResult(null);
    setRoundPhase("select");
    setCpuFirstTile(null);
    const nextFirst = roundResult === "win" ? true : roundResult === "lose" ? false : isUserTurn;
    setIsUserTurn(nextFirst);

    if (userScore >= 5 || cpuScore >= 5) {
      setGameOver(true);
      setPhase("result");
      return;
    }

    if (round + 1 >= 9) {
      const u = userScore + (roundResult === "win" ? 1 : 0);
      const c = cpuScore + (roundResult === "lose" ? 0 : 1);
      if (u !== c) {
        setGameOver(true);
        setPhase("result");
      } else {
        setSuddenDeath(true);
        const u = shuffle([...TILES]);
        const c = shuffle([...TILES]);
        setUserTiles(u);
        setCpuTiles(c);
        setUserUsed(new Set());
        setCpuUsed(new Set());
        setRound(0);
        setUserScore(0);
        setCpuScore(0);
        setRoundPhase("select");
        setCpuFirstTile(null);
        setIsUserTurn(Math.random() > 0.5);
        setCpuPlayedColors([]);
        setUserPlayedTiles([]);
        setRoundResults([]);
      }
      return;
    }
    setRound((r) => r + 1);
  }, [round, roundResult, userScore, cpuScore, isUserTurn]);

  const playRoundCpuFirst = useCallback(
    (userTile: Tile) => {
      if (cpuFirstTile === null || roundPhase !== "select" || userUsed.has(userTile)) return;
      setUserSelected(userTile);
      setCpuSelected(cpuFirstTile);
      setRoundPhase("reveal");
      setTimeout(() => {
        const u = userTile;
        const c = cpuFirstTile;
        let result: "win" | "lose" | "draw" = "draw";
        if (u > c) result = "win";
        else if (c > u) result = "lose";
        setRoundResult(result);
        setUserScore((s) => s + (result === "win" ? 1 : 0));
        setCpuScore((s) => s + (result === "lose" ? 1 : 0));
        setUserUsed((prev) => new Set(prev).add(userTile));
        setCpuUsed((prev) => new Set(prev).add(cpuFirstTile));
        setCpuPlayedColors((prev) => [...prev, getTileColor(cpuFirstTile)]);
        setUserPlayedTiles((prev) => [...prev, userTile]);
        setRoundResults((prev) => [...prev, result]);
        setRoundPhase("done");
      }, 600);
    },
    [cpuFirstTile, roundPhase, userUsed, cpuUsed]
  );

  if (phase === "rps") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100">
        <h1 className="text-3xl font-bold mb-2">흑과백</h1>
        <p className="text-zinc-400 mb-8">선을 정하기 위해 가위바위보를 하세요.</p>
        {rpsResult === null ? (
          <div className="flex gap-4">
            {RPS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => playRps(r)}
                className="px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600"
              >
                {r}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl mb-4">
              {rpsResult === "win" && "당신이 선입니다!"}
              {rpsResult === "lose" && "컴퓨터가 선입니다!"}
              {rpsResult === "draw" && "무승부! 다시 정해집니다."}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
            >
              게임 시작
            </button>
          </div>
        )}
      </main>
    );
  }

  const currentUserTiles = userTiles.filter((t) => !userUsed.has(t));
  const cpuRemainingCount = 9 - cpuUsed.size;
  const currentCpuColor = (cpuSelected ?? cpuFirstTile) !== null ? getTileColor((cpuSelected ?? cpuFirstTile)!) : null;
  const cpuPlayedBlack = cpuPlayedColors.filter((c) => c === "black").length;
  const cpuPlayedWhite = cpuPlayedColors.filter((c) => c === "white").length;
  const cpuRemainingBlack = 5 - cpuPlayedBlack - (currentCpuColor === "black" ? 1 : 0);
  const cpuRemainingWhite = 4 - cpuPlayedWhite - (currentCpuColor === "white" ? 1 : 0);

  return (
    <main className="min-h-screen flex flex-col p-6 bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-2">흑과백</h1>
        {suddenDeath && (
          <p className="text-center text-amber-400 mb-2">동점! 연장전 (새 타일 9장)</p>
        )}
        <p className="text-center text-zinc-500 text-sm mb-6">라운드 {round + 1}/9</p>

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* 나 */}
          <div>
            <p className="text-lg font-semibold mb-3">나: {userScore}점</p>
            <p className="text-sm text-zinc-400 mb-2">내 타일 (선택 가능)</p>
            <div className="flex flex-wrap gap-2">
              {currentUserTiles.map((t) => (
                <button
                  key={t}
                  onClick={() => (cpuFirstTile !== null ? playRoundCpuFirst(t) : playRound(t))}
                  disabled={roundPhase !== "select" || (isUserTurn ? false : cpuFirstTile === null)}
                  className={cn(
                    "w-12 h-12 rounded-lg border-2 font-bold text-lg flex items-center justify-center",
                    getTileColor(t) === "black"
                      ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                      : "bg-zinc-200 text-zinc-800 border-zinc-400",
                    (roundPhase !== "select" || (isUserTurn ? false : cpuFirstTile === null)) && "opacity-50 cursor-not-allowed",
                    (isUserTurn || cpuFirstTile !== null) && roundPhase === "select" && "hover:ring-2 hover:ring-amber-500"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-xs text-zinc-500 mb-1">선택한 타일의 색상</p>
              {userSelected !== null && (roundPhase === "reveal" || roundPhase === "done") ? (
                <span className="inline-flex flex-col items-center gap-0.5">
                  <span
                    className={cn(
                      "inline-flex w-12 h-12 rounded-lg border-2 font-bold text-lg items-center justify-center",
                      getTileColor(userSelected) === "black"
                        ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                        : "bg-zinc-200 text-zinc-800 border-zinc-400"
                    )}
                  >
                    {userSelected}
                  </span>
                  <span className="text-xs text-zinc-500">{getTileColor(userSelected) === "black" ? "흑" : "백"}</span>
                </span>
              ) : (
                <span className="inline-flex w-12 h-12 rounded-lg border-2 border-dashed border-zinc-600 items-center justify-center text-zinc-500 text-sm">
                  ?
                </span>
              )}
            </div>
            {userPlayedTiles.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-zinc-500 mb-1">내가 낸 타일 (라운드별)</p>
                <div className="flex flex-wrap gap-2">
                  {userPlayedTiles.map((tile, i) => (
                    <span key={i} className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 font-bold text-sm flex items-center justify-center",
                          getTileColor(tile) === "black"
                            ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                            : "bg-zinc-200 text-zinc-800 border-zinc-400"
                        )}
                      >
                        {tile}
                      </span>
                      <span className="text-[10px] text-zinc-500">{i + 1}라운드</span>
                      {roundResults[i] !== undefined && (
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            roundResults[i] === "win" && "text-green-500",
                            roundResults[i] === "lose" && "text-red-500",
                            roundResults[i] === "draw" && "text-zinc-500"
                          )}
                        >
                          {roundResults[i] === "win" && "승리"}
                          {roundResults[i] === "lose" && "패배"}
                          {roundResults[i] === "draw" && "무승부"}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 컴퓨터 */}
          <div>
            <p className="text-lg font-semibold mb-3">컴퓨터: {cpuScore}점</p>
            <p className="text-sm text-zinc-400 mb-2">컴퓨터의 타일</p>
            <div className="mb-3">
              <p className="text-xs text-zinc-500 mb-1">지금까지 낸 타일 (라운드별)</p>
              <div className="flex flex-wrap gap-2">
                {cpuPlayedColors.map((color, i) => (
                  <span key={i} className="flex flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        "w-8 h-8 rounded border flex items-center justify-center text-xs font-medium",
                        color === "black"
                          ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                          : "bg-zinc-200 text-zinc-800 border-zinc-400"
                      )}
                    >
                      {color === "black" ? "흑" : "백"}
                    </span>
                    {roundResults[i] !== undefined && (
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          roundResults[i] === "lose" && "text-green-500",
                          roundResults[i] === "win" && "text-red-500",
                          roundResults[i] === "draw" && "text-zinc-500"
                        )}
                      >
                        {roundResults[i] === "win" && "패배"}
                        {roundResults[i] === "lose" && "승리"}
                        {roundResults[i] === "draw" && "무승부"}
                      </span>
                    )}
                  </span>
                ))}
                {currentCpuColor !== null && roundPhase !== "done" && (
                  <span
                    className={cn(
                      "w-8 h-8 rounded border flex items-center justify-center text-xs font-medium ring-2 ring-amber-500",
                      currentCpuColor === "black"
                        ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                        : "bg-zinc-200 text-zinc-800 border-zinc-400"
                    )}
                  >
                    {currentCpuColor === "black" ? "흑" : "백"}
                  </span>
                )}
                {cpuPlayedColors.length === 0 && currentCpuColor === null && (
                  <span className="text-zinc-500 text-xs">아직 없음</span>
                )}
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs text-zinc-500 mb-1">남은 타일 (유추)</p>
              <div className="flex gap-2 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded bg-zinc-800 border border-zinc-600 inline-flex items-center justify-center text-zinc-100 text-xs">흑</span>
                  {cpuRemainingBlack}개
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded bg-zinc-200 border border-zinc-400 inline-flex items-center justify-center text-zinc-800 text-xs">백</span>
                  {cpuRemainingWhite}개
                </span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-zinc-500 mb-1">선택한 타일의 색상</p>
              {roundPhase !== "select" && (cpuSelected !== null || cpuFirstTile !== null) ? (
                <span
                  className={cn(
                    "inline-flex w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-sm",
                    getTileColor((cpuSelected ?? cpuFirstTile)!) === "black"
                      ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                      : "bg-zinc-200 text-zinc-800 border-zinc-400"
                  )}
                >
                  {getTileColor((cpuSelected ?? cpuFirstTile)!) === "black" ? "흑" : "백"}
                </span>
              ) : (
                <span className="inline-flex w-12 h-12 rounded-lg border-2 border-dashed border-zinc-600 items-center justify-center text-zinc-500 text-sm">
                  ?
                </span>
              )}
            </div>
          </div>
        </div>

        {roundPhase === "reveal" && (
          <p className="text-center text-zinc-400">결과 계산 중...</p>
        )}
        {roundPhase === "done" && roundResult && (
          <div className="text-center mb-6">
            <p className="text-xl font-bold">
              {roundResult === "win" && "이번 라운드 승리!"}
              {roundResult === "lose" && "이번 라운드 패배..."}
              {roundResult === "draw" && "무승부"}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              상대가 낸 숫자는 공개되지 않습니다. (흑/백만 알 수 있음)
            </p>
            <button
              onClick={nextRound}
              className="mt-4 px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
            >
              다음 라운드
            </button>
          </div>
        )}

        {roundPhase === "select" && (
          <p className="text-center text-zinc-500 text-sm">
            {isUserTurn ? "당신이 선입니다. 타일을 선택하세요." : "컴퓨터가 먼저 냅니다..."}
          </p>
        )}
        {!isUserTurn && roundPhase === "select" && cpuFirstTile === null && (
          <button
            onClick={() => {
              const cpuAvailable = TILES.filter((t) => !cpuUsed.has(t));
              const cpuTile = cpuAvailable[Math.floor(Math.random() * cpuAvailable.length)] as Tile;
              setCpuFirstTile(cpuTile);
            }}
            className="mx-auto block mt-4 px-6 py-3 rounded-lg bg-zinc-700 hover:bg-zinc-600"
          >
            컴퓨터가 선택함 (이제 당신이 타일을 선택하세요)
          </button>
        )}

        {phase === "result" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            aria-modal
            role="dialog"
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">
                {userScore > cpuScore ? "승리!" : "패배!"}
              </h2>
              <p className="text-zinc-300 mb-6">
                {userScore > cpuScore
                  ? "축하합니다! 당신이 이겼습니다."
                  : "아쉽습니다. 다음에는 이겨보세요!"}
              </p>
              <p className="text-zinc-500 text-sm mb-6">
                최종 스코어 {userScore} : {cpuScore}
              </p>
              <button
                onClick={() => {
                  setPhase("rps");
                  setRpsResult(null);
                }}
                className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                다시 하기
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
