import { useState } from "react";
import "./App.css";

type Repo = {
    id: number;
    name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    updated_at: string;
    homepage: string | null;
};

function App() {
    const [username, setUsername] = useState("");
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSearch() {
        const trimmedUsername = username.trim();

        if (trimmedUsername === "") {
            alert("GitHub 아이디를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setRepos([]);

        try {
            const response = await fetch(`https://api.github.com/users/${trimmedUsername}/repos`);

            if (!response.ok) {
                throw new Error("저장소를 불러오지 못했습니다.");
            }

            const data = await response.json();

            setRepos(data);
        } catch {
            setErrorMessage("GitHub 저장소를 불러오는 중 문제가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="app">
            <section className="app-header">
                <h1>RepoFit</h1>
                <p>GitHub 저장소를 포트폴리오 관점에서 점검해보세요.</p>
            </section>

            <section className="search-section">
                <input
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                    }}
                    placeholder="GitHub 아이디를 입력하세요. 예: Jinhani"
                />
                {isLoading && <p>저장소를 불러오는 중입니다...</p>}

                <button onClick={handleSearch} disabled={username.trim() === ""}>
                    저장소 불러오기
                </button>
            </section>

            {errorMessage !== "" && <p>{errorMessage}</p>}

            <section className="repo-list">
                {repos.map((repo) => {
                    const hasDescription = repo.description !== null && repo.description.trim() !== "";
                    const hasLanguage = repo.language !== null;
                    const hasHomepage = repo.homepage !== null && repo.homepage.trim() !== "";

                    const isPortfolioReady = hasDescription && hasLanguage && hasHomepage;

                    return (
                        <article key={repo.id} className="repo-card">
                            <h2>{repo.name}</h2>

                            <p>{repo.description ?? "설명이 없습니다."}</p>

                            <p className="repo-meta">사용 언어: {repo.language ?? "언어 정보 없음"}</p>

                            <p className="repo-meta">최근 업데이트: {repo.updated_at}</p>

                            <div className="repo-check-list">
                                <p>{hasDescription ? "설명 있음" : "설명 없음"}</p>
                                <p>{hasLanguage ? "언어 있음" : "언어 없음"}</p>
                                <p>{hasHomepage ? "배포 링크 있음" : "배포 링크 없음"}</p>
                            </div>

                            <p className={isPortfolioReady ? "ready" : "not-ready"}>
                                {isPortfolioReady ? "포트폴리오 기본 조건 충족" : "보완 필요"}
                            </p>

                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                GitHub 보기
                            </a>

                            {hasHomepage && (
                                <a href={repo.homepage} target="_blank" rel="noopener noreferrer">
                                    배포 링크 보기
                                </a>
                            )}
                        </article>
                    );
                })}
            </section>
            <p className="current-value">현재 입력값: {username}</p>
        </main>
    );
}

export default App;

// 버튼 클릭 -> API 요청 -> JSON 응답 받기 -> repos state에 저장 ->  화면에 map으로 출력
// 내가 만든 데이터가 아니라 외부에서 받은 데이터를 state에 넣는 것
